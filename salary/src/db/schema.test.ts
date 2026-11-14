import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import { categories, transactions, users } from "./schema";
import { DEFAULT_CATEGORIES } from "@/lib/default-categories";
import { isCategoryColor } from "@/lib/palette";
import { isCategoryIcon } from "@/lib/icons";

async function freshDb() {
  const client = createClient({ url: ":memory:" });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.resolve(__dirname, "migrations") });
  await client.execute("PRAGMA foreign_keys = ON");
  return db;
}

let db: Awaited<ReturnType<typeof freshDb>>;

beforeEach(async () => {
  db = await freshDb();
});

const newUser = (email = "a@example.com") =>
  db.insert(users).values({ email, passwordHash: "x" }).returning().then((r) => r[0]);

const newCategory = (userId: string, name = "Еда", type: "income" | "expense" = "expense") =>
  db
    .insert(categories)
    .values({ userId, name, type, icon: "tag", color: "#059669" })
    .returning()
    .then((r) => r[0]);

describe("схема БД", () => {
  it("создаёт пользователя с значениями по умолчанию", async () => {
    const u = await newUser();
    expect(u.currency).toBe("RUB");
    expect(u.theme).toBe("system");
    expect(u.id).toBeTruthy();
  });

  it("email уникален", async () => {
    await newUser("dup@example.com");
    await expect(newUser("dup@example.com")).rejects.toThrow();
  });

  it("название категории уникально в паре (пользователь, тип)", async () => {
    const u = await newUser();
    await newCategory(u.id, "Прочее", "expense");
    await expect(newCategory(u.id, "Прочее", "expense")).rejects.toThrow();
    await expect(newCategory(u.id, "Прочее", "income")).resolves.toBeTruthy();
  });

  it("разные пользователи могут иметь одинаковые категории", async () => {
    const a = await newUser("a@example.com");
    const b = await newUser("b@example.com");
    await newCategory(a.id);
    await expect(newCategory(b.id)).resolves.toBeTruthy();
  });

  it("запрещает сумму <= 0", async () => {
    const u = await newUser();
    const c = await newCategory(u.id);
    const insert = (amount: number) =>
      db.insert(transactions).values({
        userId: u.id,
        categoryId: c.id,
        type: "expense",
        amount,
        date: "2026-11-14",
      });
    await expect(insert(0)).rejects.toThrow();
    await expect(insert(-5)).rejects.toThrow();
    await expect(insert(100)).resolves.toBeTruthy();
  });

  it("запрещает удалять категорию с операциями (restrict)", async () => {
    const u = await newUser();
    const c = await newCategory(u.id);
    await db.insert(transactions).values({
      userId: u.id,
      categoryId: c.id,
      type: "expense",
      amount: 100,
      date: "2026-11-14",
    });
    await expect(db.delete(categories).where(eq(categories.id, c.id))).rejects.toThrow();
  });

  it("удаление пользователя каскадно удаляет данные", async () => {
    const u = await newUser();
    const c = await newCategory(u.id);
    await db.insert(transactions).values({
      userId: u.id,
      categoryId: c.id,
      type: "expense",
      amount: 100,
      date: "2026-11-14",
    });
    // удаляем операции раньше категорий (restrict), как при удалении аккаунта
    await db.delete(transactions).where(eq(transactions.userId, u.id));
    await db.delete(users).where(eq(users.id, u.id));
    expect(await db.select().from(categories)).toHaveLength(0);
    expect(await db.select().from(transactions)).toHaveLength(0);
  });
});

describe("категории по умолчанию", () => {
  it("корректны и без дублей", () => {
    const keys = new Set<string>();
    for (const c of DEFAULT_CATEGORIES) {
      expect(isCategoryIcon(c.icon)).toBe(true);
      expect(isCategoryColor(c.color)).toBe(true);
      const key = `${c.type}:${c.name}`;
      expect(keys.has(key)).toBe(false);
      keys.add(key);
    }
    expect(DEFAULT_CATEGORIES.filter((c) => c.type === "expense")).toHaveLength(11);
    expect(DEFAULT_CATEGORIES.filter((c) => c.type === "income")).toHaveLength(6);
  });

  it("вставляются в БД", async () => {
    const u = await newUser();
    await db.insert(categories).values(DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: u.id })));
    expect(await db.select().from(categories)).toHaveLength(17);
  });
});
