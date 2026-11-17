"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { endSession, getCurrentUser, requireUser, startSession } from "@/server/auth/session";
import { deleteImage } from "@/server/media";

export type FormState = { error?: string } | undefined;

async function setLocaleCookie(locale: string) {
  (await cookies()).set("locale", locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
}

/** Вход без пароля: любой корректный email. Новый email создаёт аккаунт. */
export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const email = parseEmail(String(formData.get("email") ?? ""));
  if (!email) return { error: "invalid_email" };

  // Вход без пароля: ограничиваем частоту попыток с одного адреса.
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "unknown").split(",")[0].trim();
  const limit = Number(process.env.AUTH_RATE_LIMIT) || 30;
  if (!rateLimit(`signin:${ip}`, limit, 60_000).ok) return { error: "rate_limited" };

  const current = (await cookies()).get("locale")?.value;
  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: { email, locale: current === "en" ? "en" : "ru" },
  });
  await startSession(user.id);
  await setLocaleCookie(user.locale);
  redirect(user.onboarded ? "/" : "/onboarding");
}

export async function signOut() {
  await endSession();
  redirect("/login");
}

export async function deleteAccount() {
  const user = await requireUser();
  // Фото своих упражнений лежат на диске, а не в базе: удаляем их вместе с аккаунтом.
  const withPhotos = await db.exercise.findMany({
    where: { ownerId: user.id, mediaUrl: { not: null } },
    select: { mediaUrl: true },
  });
  await Promise.all(withPhotos.map((e) => deleteImage(e.mediaUrl)));
  await db.user.delete({ where: { id: user.id } });
  await endSession();
  redirect("/login");
}

const profileSchema = z.object({
  name: z.string().trim().min(1).max(60),
  goal: z.enum(["strength", "mass", "endurance", "health"]),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  weeklyGoal: z.coerce.number().int().min(1).max(7),
  units: z.enum(["kg", "lb"]),
  locale: z.enum(["ru", "en"]),
});

export async function completeOnboarding(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid" };
  await db.user.update({ where: { id: user.id }, data: { ...parsed.data, onboarded: true } });
  await setLocaleCookie(parsed.data.locale);
  redirect("/");
}

const settingsSchema = profileSchema.extend({
  theme: z.enum(["system", "light", "dark"]),
  restDefaultSec: z.coerce.number().int().min(15).max(600),
  effectsEnabled: z.preprocess((v) => v === "on", z.boolean()),
});

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid" };
  await db.user.update({ where: { id: user.id }, data: parsed.data });
  await setLocaleCookie(parsed.data.locale);
  redirect("/profile?saved=1");
}

const prefsSchema = z.object({
  theme: z.enum(["system", "light", "dark"]).optional(),
  locale: z.enum(["ru", "en"]).optional(),
});

/**
 * Быстрое сохранение темы и языка из переключателей в сайдбаре.
 * Хранится в профиле, чтобы выбор не сбрасывался после перезагрузки и входа с другого устройства.
 */
export async function savePreferences(input: { theme?: string; locale?: string }) {
  const user = await getCurrentUser();
  if (!user) return;
  const parsed = prefsSchema.safeParse(input);
  if (!parsed.success) return;
  await db.user.update({ where: { id: user.id }, data: parsed.data });
  if (parsed.data.locale) await setLocaleCookie(parsed.data.locale);
}
