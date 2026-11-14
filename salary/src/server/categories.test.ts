import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { categories, transactions } from "@/db/schema";
import {
  createCategory,
  deleteCategory,
  listCategories,
  setCategoryArchived,
  updateCategory,
} from "./categories";
import { createTestDb, createTestUser } from "./test-utils";

let db: Db;
let userA: string;
let userB: string;

beforeEach(async () => {
  db = await createTestDb();
  userA = await createTestUser(db, "a@example.com");
  userB = await createTestUser(db, "b@example.com");
});

const find = async (userId: string, name: string, type: "income" | "expense") => {
  const [c] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.name, name), eq(categories.type, type)));
  return c;
};

const addTx = (userId: string, categoryId: string, type: "income" | "expense") =>
  db.insert(transactions).values({ userId, categoryId, type, amount: 100, date: "2026-11-14" });

describe("listCategories", () => {
  it("возвращает только категории пользователя с числом операций", async () => {
    const food = await find(userA, "Продукты", "expense");
    await addTx(userA, food.id, "expense");
    await addTx(userA, food.id, "expense");

    const list = await listCategories(db, userA);
    expect(list).toHaveLength(17);
    expect(list.every((c) => c.userId === userA)).toBe(true);
    expect(list.find((c) => c.id === food.id)?.txCount).toBe(2);
    expect(list.find((c) => c.name === "Транспорт")?.txCount).toBe(0);
  });
});

describe("createCategory", () => {
  const input = { name: "  Спорт ", type: "expense", icon: "dumbbell", color: "#059669" } as const;

  it("создаёт категорию с обрезанным названием", async () => {
    const r = await createCategory(db, userA, { ...input, name: "Спорт" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.userId).toBe(userA);
  });

  it("запрещает дубль в паре (пользователь, тип) без учёта регистра", async () => {
    const r = await createCategory(db, userA, { ...input, name: "продукты" });
    expect(r).toEqual({ ok: false, error: "duplicate" });
  });

  it("то же имя в другом типе и у другого пользователя разрешено", async () => {
    // «Подарки» есть в доходах; создаём в расходах
    expect((await createCategory(db, userA, { ...input, name: "Подарки" })).ok).toBe(true);
    const other = await createCategory(db, userB, { ...input, name: "Спорт" });
    expect(other.ok).toBe(true);
  });
});

describe("updateCategory", () => {
  it("обновляет название, иконку и цвет", async () => {
    const c = await find(userA, "Продукты", "expense");
    const r = await updateCategory(db, userA, c.id, { name: "Еда", icon: "coffee", color: "#F97316" });
    expect(r.ok).toBe(true);
    const [row] = await db.select().from(categories).where(eq(categories.id, c.id));
    expect(row).toMatchObject({ name: "Еда", icon: "coffee", color: "#F97316", type: "expense" });
  });

  it("можно сохранить своё же название (смена только цвета)", async () => {
    const c = await find(userA, "Продукты", "expense");
    const r = await updateCategory(db, userA, c.id, { name: "продукты", icon: c.icon as "tag", color: "#6366F1" });
    expect(r.ok).toBe(true);
  });

  it("отклоняет переименование в существующее", async () => {
    const c = await find(userA, "Продукты", "expense");
    const r = await updateCategory(db, userA, c.id, { name: "Транспорт", icon: "tag", color: "#6366F1" });
    expect(r).toEqual({ ok: false, error: "duplicate" });
  });

  it("не даёт менять чужую категорию", async () => {
    const theirs = await find(userB, "Продукты", "expense");
    const r = await updateCategory(db, userA, theirs.id, { name: "Взлом", icon: "tag", color: "#6366F1" });
    expect(r).toEqual({ ok: false, error: "not_found" });
    const [row] = await db.select().from(categories).where(eq(categories.id, theirs.id));
    expect(row.name).toBe("Продукты");
  });
});

describe("setCategoryArchived", () => {
  it("архивирует и восстанавливает", async () => {
    const c = await find(userA, "Связь", "expense");
    expect(await setCategoryArchived(db, userA, c.id, true)).toEqual({ ok: true });
    expect((await find(userA, "Связь", "expense")).isArchived).toBe(true);
    await setCategoryArchived(db, userA, c.id, false);
    expect((await find(userA, "Связь", "expense")).isArchived).toBe(false);
  });

  it("чужую категорию не архивирует", async () => {
    const theirs = await find(userB, "Связь", "expense");
    expect(await setCategoryArchived(db, userA, theirs.id, true)).toEqual({ ok: false, error: "not_found" });
    expect((await find(userB, "Связь", "expense")).isArchived).toBe(false);
  });
});

describe("deleteCategory", () => {
  it("удаляет категорию без операций", async () => {
    const c = await find(userA, "Связь", "expense");
    expect(await deleteCategory(db, userA, c.id)).toEqual({ ok: true });
    expect(await find(userA, "Связь", "expense")).toBeUndefined();
  });

  it("запрещает удаление при наличии операций без переноса", async () => {
    const c = await find(userA, "Продукты", "expense");
    await addTx(userA, c.id, "expense");
    expect(await deleteCategory(db, userA, c.id)).toEqual({
      ok: false,
      error: "has_transactions",
      count: 1,
    });
    expect(await find(userA, "Продукты", "expense")).toBeDefined();
  });

  it("переносит операции и удаляет категорию", async () => {
    const from = await find(userA, "Продукты", "expense");
    const to = await find(userA, "Прочее", "expense");
    await addTx(userA, from.id, "expense");
    await addTx(userA, from.id, "expense");

    expect(await deleteCategory(db, userA, from.id, { reassignTo: to.id })).toEqual({ ok: true });
    const txs = await db.select().from(transactions).where(eq(transactions.userId, userA));
    expect(txs).toHaveLength(2);
    expect(txs.every((t) => t.categoryId === to.id)).toBe(true);
    expect(await find(userA, "Продукты", "expense")).toBeUndefined();
  });

  it("отклоняет перенос в категорию другого типа, в себя или чужую", async () => {
    const from = await find(userA, "Продукты", "expense");
    await addTx(userA, from.id, "expense");
    const income = await find(userA, "Зарплата", "income");
    const theirs = await find(userB, "Прочее", "expense");

    for (const reassignTo of [income.id, from.id, theirs.id, "missing"]) {
      expect(await deleteCategory(db, userA, from.id, { reassignTo })).toEqual({
        ok: false,
        error: "invalid_target",
      });
    }
    expect(await find(userA, "Продукты", "expense")).toBeDefined();
  });

  it("не удаляет чужую категорию", async () => {
    const theirs = await find(userB, "Связь", "expense");
    expect(await deleteCategory(db, userA, theirs.id)).toEqual({ ok: false, error: "not_found" });
    expect(await find(userB, "Связь", "expense")).toBeDefined();
  });
});
