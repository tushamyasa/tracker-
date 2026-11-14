import { hash, verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { categories, transactions, users } from "@/db/schema";
import type { CurrencyCode } from "@/lib/currencies";
import { ARGON2_OPTIONS } from "./auth/register";

export type UserSettings = { email: string; currency: CurrencyCode | string };

export async function getUserSettings(db: Db, userId: string): Promise<UserSettings | null> {
  const [u] = await db
    .select({ email: users.email, currency: users.currency })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return u ?? null;
}

export async function getUserCurrency(db: Db, userId: string): Promise<string> {
  return (await getUserSettings(db, userId))?.currency ?? "RUB";
}

export async function updateCurrency(db: Db, userId: string, currency: CurrencyCode): Promise<void> {
  await db.update(users).set({ currency }).where(eq(users.id, userId));
}

export type AccountResult = { ok: true } | { ok: false; error: "wrong_password" | "not_found" };

async function checkPassword(
  db: Db,
  userId: string,
  password: string,
): Promise<AccountResult> {
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return { ok: false, error: "not_found" };
  const valid = await verify(u.passwordHash, password).catch(() => false);
  return valid ? { ok: true } : { ok: false, error: "wrong_password" };
}

export async function changePassword(
  db: Db,
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<AccountResult> {
  const check = await checkPassword(db, userId, currentPassword);
  if (!check.ok) return check;
  const passwordHash = await hash(newPassword, ARGON2_OPTIONS);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
  return { ok: true };
}

/** Удаляет аккаунт и все данные (операции → категории → пользователь) одним batch. */
export async function deleteAccount(
  db: Db,
  userId: string,
  password: string,
): Promise<AccountResult> {
  const check = await checkPassword(db, userId, password);
  if (!check.ok) return check;
  await db.batch([
    db.delete(transactions).where(eq(transactions.userId, userId)),
    db.delete(categories).where(eq(categories.userId, userId)),
    db.delete(users).where(eq(users.id, userId)),
  ]);
  return { ok: true };
}
