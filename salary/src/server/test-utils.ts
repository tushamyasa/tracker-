import path from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "@/db/schema";
import type { Db } from "@/db/client";
import { registerUser } from "@/server/auth/register";

/** Только для тестов: свежая in-memory БД с применёнными миграциями. */
export async function createTestDb(): Promise<Db> {
  const client = createClient({ url: ":memory:" });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.resolve(__dirname, "../db/migrations") });
  return db;
}

/** Создаёт пользователя (с категориями по умолчанию) и возвращает его id. */
export async function createTestUser(db: Db, email: string): Promise<string> {
  const r = await registerUser(db, { email, password: "password123" });
  if (!r.ok) throw new Error("не удалось создать тестового пользователя");
  return r.userId;
}
