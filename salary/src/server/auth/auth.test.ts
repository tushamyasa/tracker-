import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { categories, users } from "@/db/schema";
import type { Db } from "@/db/client";
import { registerUser } from "./register";
import { verifyCredentials } from "./credentials";
import { authConfig } from "@/auth.config";

let db: Db;

beforeEach(async () => {
  const client = createClient({ url: ":memory:" });
  db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.resolve(__dirname, "../../db/migrations") });
});

describe("registerUser", () => {
  it("создаёт пользователя с argon2id-хэшем и 17 категориями", async () => {
    const r = await registerUser(db, { email: "a@example.com", password: "password123" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const [u] = await db.select().from(users).where(eq(users.id, r.userId));
    expect(u.email).toBe("a@example.com");
    expect(u.passwordHash).toMatch(/^\$argon2id\$/);
    expect(u.passwordHash).not.toContain("password123");

    const cats = await db.select().from(categories).where(eq(categories.userId, r.userId));
    expect(cats).toHaveLength(17);
  });

  it("отклоняет дубль email", async () => {
    await registerUser(db, { email: "dup@example.com", password: "password123" });
    const r = await registerUser(db, { email: "dup@example.com", password: "another-pass" });
    expect(r).toEqual({ ok: false, error: "email_taken" });
    expect(await db.select().from(users)).toHaveLength(1);
  });

  it("параллельная регистрация одного email даёт ровно одного пользователя", async () => {
    const results = await Promise.all([
      registerUser(db, { email: "race@example.com", password: "password123" }),
      registerUser(db, { email: "race@example.com", password: "password123" }),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await db.select().from(users)).toHaveLength(1);
    // категории не задвоились (batch атомарен)
    expect(await db.select().from(categories)).toHaveLength(17);
  });
});

describe("verifyCredentials", () => {
  beforeEach(async () => {
    await registerUser(db, { email: "user@example.com", password: "correct-horse" });
  });

  it("возвращает пользователя при верном пароле (email нечувствителен к регистру)", async () => {
    const u = await verifyCredentials(db, "USER@example.com", "correct-horse");
    expect(u?.email).toBe("user@example.com");
    expect(u?.id).toBeTruthy();
  });

  it("null при неверном пароле", async () => {
    expect(await verifyCredentials(db, "user@example.com", "wrong")).toBeNull();
  });

  it("null для неизвестного email", async () => {
    expect(await verifyCredentials(db, "nobody@example.com", "correct-horse")).toBeNull();
  });

  it("null для некорректного ввода", async () => {
    expect(await verifyCredentials(db, undefined, undefined)).toBeNull();
    expect(await verifyCredentials(db, "not-email", "x")).toBeNull();
  });
});

describe("authorized callback (защита маршрутов)", () => {
  const authorized = authConfig.callbacks.authorized as (a: {
    auth: unknown;
    request: { nextUrl: URL };
  }) => boolean | Response;
  const req = (p: string) => ({ nextUrl: new URL(`http://localhost:3000${p}`) });
  const session = { user: { id: "1" } };

  it("закрытые страницы недоступны без сессии", () => {
    expect(authorized({ auth: null, request: req("/dashboard") })).toBe(false);
    expect(authorized({ auth: null, request: req("/transactions") })).toBe(false);
  });

  it("закрытые страницы доступны с сессией", () => {
    expect(authorized({ auth: session, request: req("/dashboard") })).toBe(true);
  });

  it("/login и /register открыты без сессии", () => {
    expect(authorized({ auth: null, request: req("/login") })).toBe(true);
    expect(authorized({ auth: null, request: req("/register") })).toBe(true);
  });

  it("авторизованного с /login редиректит на /dashboard", () => {
    const res = authorized({ auth: session, request: req("/login") });
    expect(res).toBeInstanceOf(Response);
    expect((res as Response).headers.get("location")).toBe("http://localhost:3000/dashboard");
  });
});
