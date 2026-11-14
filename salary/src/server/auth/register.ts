import { hash } from "@node-rs/argon2";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { categories, users } from "@/db/schema";
import { DEFAULT_CATEGORIES } from "@/lib/default-categories";

/** Параметры argon2id по рекомендации OWASP (19 MiB, t=2, p=1). */
export const ARGON2_OPTIONS = {
  algorithm: 2, // Argon2id
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export type RegisterResult =
  | { ok: true; userId: string }
  | { ok: false; error: "email_taken" };

function isUniqueViolation(e: unknown): boolean {
  const msg = e instanceof Error ? `${e.message} ${String((e as { cause?: unknown }).cause ?? "")}` : "";
  return /UNIQUE constraint failed|SQLITE_CONSTRAINT/i.test(msg);
}

/**
 * Создаёт пользователя и набор категорий по умолчанию одним атомарным batch.
 * Email должен быть уже нормализован (trim + lowercase) валидатором.
 */
export async function registerUser(
  db: Db,
  input: { email: string; password: string; name?: string | null },
): Promise<RegisterResult> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);
  if (existing.length > 0) return { ok: false, error: "email_taken" };

  const passwordHash = await hash(input.password, ARGON2_OPTIONS);
  const userId = createId();

  try {
    await db.batch([
      db.insert(users).values({
        id: userId,
        email: input.email,
        passwordHash,
        name: input.name ?? null,
      }),
      db.insert(categories).values(DEFAULT_CATEGORIES.map((c) => ({ ...c, userId }))),
    ]);
  } catch (e) {
    // гонка: параллельная регистрация того же email
    if (isUniqueViolation(e)) return { ok: false, error: "email_taken" };
    throw e;
  }

  return { ok: true, userId };
}
