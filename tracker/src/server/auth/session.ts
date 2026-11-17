import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signToken, verifyToken } from "./token";

export async function startSession(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Текущий пользователь или null. Кэшируется в рамках одного запроса. */
export const getCurrentUser = cache(async () => {
  const store = await cookies();
  const userId = await verifyToken(store.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
});

/** Для защищённых страниц и действий: без сессии отправляет на вход. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
