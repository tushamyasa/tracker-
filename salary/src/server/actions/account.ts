"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { signOut } from "@/auth";
import { db } from "@/db/client";
import { CURRENCY_CODES } from "@/lib/currencies";
import { loginLimiter } from "@/lib/rate-limit";
import { passwordSchema } from "@/lib/validators/auth";
import * as account from "@/server/account";
import { requireUserId } from "@/server/session";

export async function updateCurrencyAction(
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();
  const parsed = z.enum(CURRENCY_CODES).safeParse(code);
  if (!parsed.success) return { ok: false, error: "Неизвестная валюта" };
  await account.updateCurrency(db, userId, parsed.data);
  revalidatePath("/", "layout");
  return { ok: true };
}

export type AccountFormState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Partial<Record<"currentPassword" | "newPassword" | "confirmPassword" | "password", string>>;
};

const text = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
};

export async function changePasswordAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const userId = await requireUserId();
  const currentPassword = text(formData, "currentPassword");
  const newPassword = text(formData, "newPassword");
  const confirmPassword = text(formData, "confirmPassword");

  if (!currentPassword) return { fieldErrors: { currentPassword: "Введите текущий пароль" } };
  const pw = passwordSchema.safeParse(newPassword);
  if (!pw.success) return { fieldErrors: { newPassword: pw.error.issues[0].message } };
  if (newPassword !== confirmPassword) return { fieldErrors: { confirmPassword: "Пароли не совпадают" } };

  const limit = loginLimiter.check(`pw:${userId}`);
  if (!limit.ok) {
    return { error: `Слишком много попыток. Повторите через ${Math.ceil(limit.retryAfterSec / 60)} мин.` };
  }

  const r = await account.changePassword(db, userId, currentPassword, newPassword);
  if (!r.ok) {
    return r.error === "wrong_password"
      ? { fieldErrors: { currentPassword: "Неверный пароль" } }
      : { error: "Аккаунт не найден" };
  }
  return { success: true };
}

export async function deleteAccountAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const userId = await requireUserId();
  const password = text(formData, "password");
  if (!password) return { fieldErrors: { password: "Введите пароль для подтверждения" } };

  const limit = loginLimiter.check(`del:${userId}`);
  if (!limit.ok) {
    return { error: `Слишком много попыток. Повторите через ${Math.ceil(limit.retryAfterSec / 60)} мин.` };
  }

  const r = await account.deleteAccount(db, userId, password);
  if (!r.ok) {
    return r.error === "wrong_password"
      ? { fieldErrors: { password: "Неверный пароль" } }
      : { error: "Аккаунт не найден" };
  }
  await signOut({ redirectTo: "/login" }); // выбрасывает redirect
  return { success: true };
}
