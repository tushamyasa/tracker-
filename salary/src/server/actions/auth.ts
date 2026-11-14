"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { db } from "@/db/client";
import { loginLimiter, registerLimiter } from "@/lib/rate-limit";
import { loginSchema, registerSchema } from "@/lib/validators/auth";
import { registerUser } from "@/server/auth/register";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "password" | "confirmPassword", string>>;
  /** Возвращаем введённый email, чтобы не терять его при ошибке. */
  email?: string;
};

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

function fieldErrorsFrom(error: z.ZodError): AuthFormState["fieldErrors"] {
  const out: NonNullable<AuthFormState["fieldErrors"]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if ((key === "email" || key === "password" || key === "confirmPassword") && !out[key]) {
      out[key] = issue.message;
    }
  }
  return out;
}

const text = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
};

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: text(formData, "email"),
    password: text(formData, "password"),
  });
  const rawEmail = text(formData, "email");
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), email: rawEmail };
  }

  const key = `${await clientIp()}:${parsed.data.email}`;
  const limit = loginLimiter.check(key);
  if (!limit.ok) {
    const min = Math.ceil(limit.retryAfterSec / 60);
    return {
      error: `Слишком много попыток входа. Повторите через ${min} мин.`,
      email: rawEmail,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "Неверный email или пароль", email: rawEmail };
    }
    throw e; // NEXT_REDIRECT при успехе
  }
  return {};
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const rawEmail = text(formData, "email");
  const parsed = registerSchema.safeParse({
    email: rawEmail,
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), email: rawEmail };
  }

  const ip = await clientIp();
  const limit = registerLimiter.check(ip);
  if (!limit.ok) {
    const min = Math.ceil(limit.retryAfterSec / 60);
    return { error: `Слишком много регистраций. Повторите через ${min} мин.`, email: rawEmail };
  }

  const result = await registerUser(db, {
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (!result.ok) {
    return { fieldErrors: { email: "Этот email уже зарегистрирован" }, email: rawEmail };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "Аккаунт создан, но войти не удалось. Войдите вручную.", email: rawEmail };
    }
    throw e;
  }
  return {};
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
