import { hash, verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { users } from "@/db/schema";
import { loginSchema } from "@/lib/validators/auth";
import { ARGON2_OPTIONS } from "./register";

export type AuthUser = { id: string; email: string; name: string | null };

let dummyHash: Promise<string> | undefined;

/**
 * Проверка email+пароль. Для несуществующего email всё равно выполняется
 * verify по фиктивному хэшу, чтобы время ответа не выдавало наличие аккаунта.
 */
export async function verifyCredentials(
  db: Db,
  rawEmail: unknown,
  rawPassword: unknown,
): Promise<AuthUser | null> {
  const parsed = loginSchema.safeParse({ email: rawEmail, password: rawPassword });
  if (!parsed.success) return null;
  const { email, password } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user) {
    dummyHash ??= hash("dummy-password-for-timing", ARGON2_OPTIONS);
    await verify(await dummyHash, password).catch(() => false);
    return null;
  }

  const valid = await verify(user.passwordHash, password).catch(() => false);
  return valid ? { id: user.id, email: user.email, name: user.name } : null;
}
