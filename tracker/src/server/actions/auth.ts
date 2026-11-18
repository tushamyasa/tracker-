"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { appUrl, authMode } from "@/lib/auth-config";
import { db } from "@/lib/db";
import { parseEmail } from "@/lib/email";
import { buildLoginEmail } from "@/lib/login-email";
import { endSession, getCurrentUser, requireUser, startSession } from "@/server/auth/session";
import { consumeLoginToken, createLoginToken } from "@/server/auth/login-token";
import { sendMail } from "@/server/mail";
import { rateLimit } from "@/server/rate-limit";
import { deleteImage } from "@/server/media";

export type FormState = { error?: string; sent?: string } | undefined;

async function setLocaleCookie(locale: string) {
  (await cookies()).set("locale", locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
}

function clientIp(h: Headers): string {
  return (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "unknown").split(",")[0].trim();
}

let warnedOpenMode = false;

/**
 * Вход. В режиме AUTH_MODE=open принимается любой корректный email (аккаунт создаётся сразу).
 * В режиме email на адрес уходит одноразовая ссылка, аккаунт создаётся после её открытия.
 */
export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const email = parseEmail(String(formData.get("email") ?? ""));
  if (!email) return { error: "invalid_email" };

  const h = await headers();
  const ip = clientIp(h);

  if (authMode() === "email") return requestLoginLink(email, ip);

  if (process.env.NODE_ENV === "production" && !warnedOpenMode) {
    warnedOpenMode = true;
    console.warn(
      "[auth] AUTH_MODE=open: любой может войти в чужой аккаунт, зная email. Для публичного запуска задайте AUTH_MODE=email.",
    );
  }
  // Вход без пароля: ограничиваем частоту попыток с одного адреса.
  const limit = Number(process.env.AUTH_RATE_LIMIT) || 30;
  if (!(await rateLimit(`signin:${ip}`, limit, 60_000)).ok) return { error: "rate_limited" };

  return startUserSession(email);
}

const LINK_WINDOW_MS = 15 * 60_000;

async function requestLoginLink(email: string, ip: string): Promise<FormState> {
  const base = appUrl();
  if (!base) {
    console.error("[auth] AUTH_MODE=email требует APP_URL, например https://tracker.example.com");
    return { error: "not_configured" };
  }
  // Лимиты и по адресу, и по почте: нельзя ни заспамить чужой ящик, ни перебирать адреса.
  const ipLimit = Number(process.env.AUTH_LINK_IP_LIMIT) || 20;
  const emailLimit = Number(process.env.AUTH_LINK_EMAIL_LIMIT) || 5;
  if (!(await rateLimit(`link-ip:${ip}`, ipLimit, LINK_WINDOW_MS)).ok) {
    return { error: "rate_limited" };
  }
  if (!(await rateLimit(`link-email:${email}`, emailLimit, LINK_WINDOW_MS)).ok) {
    return { error: "rate_limited" };
  }

  const locale = (await cookies()).get("locale")?.value === "en" ? "en" : "ru";
  const token = await createLoginToken(email);
  const link = `${base}/auth/verify?token=${encodeURIComponent(token)}`;
  try {
    await sendMail({ to: email, ...buildLoginEmail(locale, link) });
  } catch (e) {
    console.error("[auth] не удалось отправить письмо", e);
    return { error: "mail_failed" };
  }
  // Ответ одинаков для новых и существующих адресов: аккаунты не перечисляются.
  return { sent: email };
}

async function startUserSession(email: string): Promise<never> {
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

/**
 * Завершает вход по ссылке из письма. Вызывается кнопкой на странице подтверждения,
 * а не при открытии ссылки: почтовые сканеры открывают ссылки сами и израсходовали бы токен.
 */
export async function completeLogin(token: string): Promise<never> {
  const email = await consumeLoginToken(token);
  if (!email) redirect(`/auth/verify?token=${encodeURIComponent(token)}`);
  return startUserSession(email);
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
