import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { categories, transactions } from "@/db/schema";
import { transactionFiltersSchema, transactionInputSchema } from "@/lib/validators/transaction";
import {
  createTransaction,
  deleteTransaction,
  listFormCategories,
  listTransactions,
  updateTransaction,
} from "./transactions";
import { createTestDb, createTestUser } from "./test-utils";

let db: Db;
let userA: string;
let userB: string;

beforeEach(async () => {
  db = await createTestDb();
  userA = await createTestUser(db, "a@example.com");
  userB = await createTestUser(db, "b@example.com");
});

const cat = async (userId: string, name: string, type: "income" | "expense") => {
  const [c] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.name, name), eq(categories.type, type)));
  return c;
};

const parse = (o: Record<string, unknown>) => transactionInputSchema.parse(o);

describe("transactionInputSchema", () => {
  const base = { type: "expense", amount: "1 234,56", categoryId: "c1", date: "2026-11-14" };

  it("переводит сумму в копейки и нормализует заметку", () => {
    const r = parse({ ...base, note: "  обед  " });
    expect(r.amount).toBe(123456);
    expect(r.note).toBe("обед");
    expect(parse({ ...base, note: "" }).note).toBeNull();
    expect(parse(base).note).toBeNull();
  });

  it.each([
    { amount: "0" },
    { amount: "abc" },
    { amount: "-5" },
    { date: "2026-02-30" },
    { categoryId: "" },
    { type: "transfer" },
    { note: "x".repeat(201) },
  ])("отклоняет %j", (patch) => {
    expect(transactionInputSchema.safeParse({ ...base, ...patch }).success).toBe(false);
  });
});

describe("transactionFiltersSchema", () => {
  it("игнорирует мусор в параметрах", () => {
    const r = transactionFiltersSchema.parse({ from: "bad", type: "x", page: "-3", q: "  кофе " });
    expect(r).toEqual({ q: "кофе", page: 1 });
  });

  it("принимает корректные значения", () => {
    const r = transactionFiltersSchema.parse({ from: "2026-01-01", type: "income", page: "2" });
    expect(r).toMatchObject({ from: "2026-01-01", type: "income", page: 2 });
  });
});

describe("createTransaction", () => {
  it("создаёт операцию", async () => {
    const food = await cat(userA, "Продукты", "expense");
    const r = await createTransaction(
      db,
      userA,
      parse({ type: "expense", amount: "100,50", categoryId: food.id, date: "2026-11-14", note: "хлеб" }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toMatchObject({ amount: 10050, userId: userA, categoryId: food.id });
  });

  it("отклоняет несовпадение типа, чужую и архивную категорию", async () => {
    const salary = await cat(userA, "Зарплата", "income");
    const theirs = await cat(userB, "Продукты", "expense");
    const food = await cat(userA, "Продукты", "expense");
    const mk = (categoryId: string, type = "expense") =>
      parse({ type, amount: "10", categoryId, date: "2026-11-14" });

    expect(await createTransaction(db, userA, mk(salary.id))).toEqual({ ok: false, error: "type_mismatch" });
    expect(await createTransaction(db, userA, mk(theirs.id))).toEqual({ ok: false, error: "category_not_found" });
    expect(await createTransaction(db, userA, mk("nope"))).toEqual({ ok: false, error: "category_not_found" });

    await db.update(categories).set({ isArchived: true }).where(eq(categories.id, food.id));
    expect(await createTransaction(db, userA, mk(food.id))).toEqual({ ok: false, error: "category_archived" });
    expect(await db.select().from(transactions)).toHaveLength(0);
  });
});

describe("updateTransaction", () => {
  it("обновляет поля; оставить архивную категорию можно", async () => {
    const food = await cat(userA, "Продукты", "expense");
    const created = await createTransaction(
      db,
      userA,
      parse({ type: "expense", amount: "10", categoryId: food.id, date: "2026-11-01" }),
    );
    if (!created.ok) throw new Error("setup");
    await db.update(categories).set({ isArchived: true }).where(eq(categories.id, food.id));

    const r = await updateTransaction(
      db,
      userA,
      created.data.id,
      parse({ type: "expense", amount: "20", categoryId: food.id, date: "2026-11-02", note: "n" }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toMatchObject({ amount: 2000, date: "2026-11-02", note: "n" });
  });

  it("не даёт менять чужую операцию", async () => {
    const theirsCat = await cat(userB, "Продукты", "expense");
    const theirs = await createTransaction(
      db,
      userB,
      parse({ type: "expense", amount: "10", categoryId: theirsCat.id, date: "2026-11-01" }),
    );
    if (!theirs.ok) throw new Error("setup");
    const mine = await cat(userA, "Продукты", "expense");
    const r = await updateTransaction(
      db,
      userA,
      theirs.data.id,
      parse({ type: "expense", amount: "99", categoryId: mine.id, date: "2026-11-01" }),
    );
    expect(r).toEqual({ ok: false, error: "not_found" });
    const [row] = await db.select().from(transactions).where(eq(transactions.id, theirs.data.id));
    expect(row.amount).toBe(1000);
  });
});

describe("deleteTransaction", () => {
  it("удаляет свою и не трогает чужую", async () => {
    const a = await cat(userA, "Продукты", "expense");
    const b = await cat(userB, "Продукты", "expense");
    const mine = await createTransaction(db, userA, parse({ type: "expense", amount: "1", categoryId: a.id, date: "2026-11-01" }));
    const theirs = await createTransaction(db, userB, parse({ type: "expense", amount: "1", categoryId: b.id, date: "2026-11-01" }));
    if (!mine.ok || !theirs.ok) throw new Error("setup");

    expect(await deleteTransaction(db, userA, theirs.data.id)).toEqual({ ok: false, error: "not_found" });
    expect(await deleteTransaction(db, userA, mine.data.id)).toEqual({ ok: true });
    expect(await db.select().from(transactions)).toHaveLength(1);
  });
});

describe("listTransactions", () => {
  beforeEach(async () => {
    const food = await cat(userA, "Продукты", "expense");
    const cafe = await cat(userA, "Кафе и рестораны", "expense");
    const salary = await cat(userA, "Зарплата", "income");
    const add = (categoryId: string, type: "income" | "expense", amount: string, date: string, note?: string) =>
      createTransaction(db, userA, parse({ type, amount, categoryId, date, note }));

    await add(salary.id, "income", "100000", "2026-11-05", "Аванс за ноябрь");
    await add(food.id, "expense", "1500,50", "2026-11-06", "Пятёрочка");
    await add(cafe.id, "expense", "800", "2026-11-10", "Кофе с коллегами");
    await add(food.id, "expense", "300", "2026-10-30", "Хлеб 100%");

    // чужие данные не должны попадать в выдачу
    const theirs = await cat(userB, "Продукты", "expense");
    await createTransaction(db, userB, parse({ type: "expense", amount: "999", categoryId: theirs.id, date: "2026-11-06" }));
  });

  it("сортирует по дате ↓ и считает итоги", async () => {
    const r = await listTransactions(db, userA);
    expect(r.total).toBe(4);
    expect(r.rows.map((x) => x.date)).toEqual(["2026-11-10", "2026-11-06", "2026-11-05", "2026-10-30"]);
    expect(r.totals).toEqual({ income: 10000000, expense: 150050 + 80000 + 30000 });
    expect(r.rows[0]).toMatchObject({ categoryName: "Кафе и рестораны" });
    expect(r.rows.every((x) => x.userId === userA)).toBe(true);
  });

  it("фильтрует по периоду, типу и категории", async () => {
    expect((await listTransactions(db, userA, { from: "2026-11-01", to: "2026-11-30" })).total).toBe(3);
    expect((await listTransactions(db, userA, { type: "income" })).total).toBe(1);
    const food = await cat(userA, "Продукты", "expense");
    const r = await listTransactions(db, userA, { categoryId: food.id });
    expect(r.total).toBe(2);
  });

  it("ищет по заметке без учёта регистра кириллицы и экранирует % и _", async () => {
    expect((await listTransactions(db, userA, { q: "кофе" })).total).toBe(1);
    expect((await listTransactions(db, userA, { q: "КОФЕ" })).total).toBe(1);
    expect((await listTransactions(db, userA, { q: "пятёрочка" })).total).toBe(1);
    expect((await listTransactions(db, userA, { q: "100%" })).total).toBe(1);
    expect((await listTransactions(db, userA, { q: "%" })).total).toBe(1);
    expect((await listTransactions(db, userA, { q: "_" })).total).toBe(0);
  });

  it("пагинирует", async () => {
    const p1 = await listTransactions(db, userA, { page: 1 }, 3);
    const p2 = await listTransactions(db, userA, { page: 2 }, 3);
    expect(p1.rows).toHaveLength(3);
    expect(p2.rows).toHaveLength(1);
    expect(p1.total).toBe(4);
    expect(p2.page).toBe(2);
  });
});

describe("listFormCategories", () => {
  it("возвращает только активные категории пользователя", async () => {
    const food = await cat(userA, "Продукты", "expense");
    await db.update(categories).set({ isArchived: true }).where(eq(categories.id, food.id));
    const list = await listFormCategories(db, userA);
    expect(list).toHaveLength(16);
    expect(list.find((c) => c.id === food.id)).toBeUndefined();
  });
});
