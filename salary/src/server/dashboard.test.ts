import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { categories, transactions } from "@/db/schema";
import { getDashboardData, getExpenseByCategory, getMonthlySeries, getRecentTransactions, getSummary } from "./dashboard";
import { createTestDb, createTestUser } from "./test-utils";

let db: Db;
let userA: string;
let userB: string;

beforeEach(async () => {
  db = await createTestDb();
  userA = await createTestUser(db, "a@example.com");
  userB = await createTestUser(db, "b@example.com");
});

const cat = async (userId: string, name: string, type: "income" | "expense") =>
  (
    await db
      .select()
      .from(categories)
      .where(and(eq(categories.userId, userId), eq(categories.name, name), eq(categories.type, type)))
  )[0];

async function add(userId: string, catName: string, type: "income" | "expense", amount: number, date: string) {
  const c = await cat(userId, catName, type);
  await db.insert(transactions).values({ userId, categoryId: c.id, type, amount, date });
}

describe("getSummary", () => {
  it("считает доходы, расходы и баланс за период включительно", async () => {
    await add(userA, "Зарплата", "income", 100000, "2026-11-01");
    await add(userA, "Продукты", "expense", 30000, "2026-11-30");
    await add(userA, "Продукты", "expense", 5000, "2026-10-31"); // вне периода
    await add(userA, "Продукты", "expense", 7000, "2026-12-01"); // вне периода

    const s = await getSummary(db, userA, { from: "2026-11-01", to: "2026-11-30" });
    expect(s).toEqual({ income: 100000, expense: 30000, balance: 70000 });
  });

  it("пустой период → нули; чужие данные не учитываются", async () => {
    await add(userB, "Зарплата", "income", 999999, "2026-11-10");
    expect(await getSummary(db, userA, { from: "2026-11-01", to: "2026-11-30" })).toEqual({
      income: 0,
      expense: 0,
      balance: 0,
    });
  });

  it("баланс может быть отрицательным", async () => {
    await add(userA, "Продукты", "expense", 500, "2026-11-10");
    expect((await getSummary(db, userA, { from: "2026-11-01", to: "2026-11-30" })).balance).toBe(-500);
  });
});

describe("getMonthlySeries", () => {
  it("возвращает 12 месяцев по возрастанию с нулями для пустых", async () => {
    await add(userA, "Зарплата", "income", 1000, "2026-11-05");
    await add(userA, "Продукты", "expense", 400, "2026-11-20");
    await add(userA, "Продукты", "expense", 250, "2026-03-15");
    await add(userA, "Продукты", "expense", 111, "2025-10-31"); // за окном (окно: 2025-12 … 2026-11)

    const s = await getMonthlySeries(db, userA, 2026, 11, 12);
    expect(s).toHaveLength(12);
    expect(s[0].key).toBe("2025-12");
    expect(s[11].key).toBe("2026-11");
    expect(s[11]).toEqual({ key: "2026-11", income: 1000, expense: 400, balance: 600 });
    expect(s.find((p) => p.key === "2026-03")).toMatchObject({ expense: 250, income: 0, balance: -250 });
    expect(s.find((p) => p.key === "2026-05")).toMatchObject({ income: 0, expense: 0 });
    expect(s.reduce((sum, p) => sum + p.expense, 0)).toBe(650);
  });

  it("не смешивает данные пользователей", async () => {
    await add(userB, "Зарплата", "income", 5000, "2026-11-05");
    const s = await getMonthlySeries(db, userA, 2026, 11, 12);
    expect(s.every((p) => p.income === 0 && p.expense === 0)).toBe(true);
  });
});

describe("getExpenseByCategory", () => {
  const range = { from: "2026-11-01", to: "2026-11-30" };

  it("сортирует по сумме, считает проценты, игнорирует доходы", async () => {
    await add(userA, "Продукты", "expense", 7500, "2026-11-02");
    await add(userA, "Транспорт", "expense", 2500, "2026-11-03");
    await add(userA, "Зарплата", "income", 100000, "2026-11-04");

    const r = await getExpenseByCategory(db, userA, range);
    expect(r.map((x) => [x.name, x.amount, x.percent])).toEqual([
      ["Продукты", 7500, 75],
      ["Транспорт", 2500, 25],
    ]);
  });

  it("сворачивает хвост в «Остальные»", async () => {
    const names = ["Продукты", "Транспорт", "Жильё", "Коммуналка", "Здоровье"];
    for (const [i, n] of names.entries()) await add(userA, n, "expense", (5 - i) * 100, "2026-11-02");

    const r = await getExpenseByCategory(db, userA, range, 3);
    expect(r).toHaveLength(4);
    expect(r[3]).toMatchObject({ id: null, name: "Остальные", amount: 200 + 100 });
    expect(r.reduce((s, x) => s + x.amount, 0)).toBe(1500);
  });

  it("пусто, если расходов нет", async () => {
    await add(userA, "Зарплата", "income", 1000, "2026-11-02");
    expect(await getExpenseByCategory(db, userA, range)).toEqual([]);
  });
});

describe("getRecentTransactions / getDashboardData", () => {
  it("возвращает последние операции по убыванию даты", async () => {
    for (let d = 1; d <= 12; d++) await add(userA, "Продукты", "expense", 100 + d, `2026-11-${String(d).padStart(2, "0")}`);
    const r = await getRecentTransactions(db, userA, 10);
    expect(r).toHaveLength(10);
    expect(r[0].date).toBe("2026-11-12");
  });

  it("собирает все данные дашборда", async () => {
    await add(userA, "Зарплата", "income", 10000, "2026-11-05");
    await add(userA, "Продукты", "expense", 4000, "2026-10-05");
    const data = await getDashboardData(db, userA, {
      kind: "month",
      year: 2026,
      month: 11,
      range: { from: "2026-11-01", to: "2026-11-30" },
      prevRange: { from: "2026-10-01", to: "2026-10-31" },
    });
    expect(data.summary.income).toBe(10000);
    expect(data.previous.expense).toBe(4000);
    expect(data.series).toHaveLength(12);
    expect(data.recent).toHaveLength(2);
  });

  it("для года график показывает январь–декабрь", async () => {
    const data = await getDashboardData(db, userA, {
      kind: "year",
      year: 2025,
      month: 0,
      range: { from: "2025-01-01", to: "2025-12-31" },
      prevRange: { from: "2024-01-01", to: "2024-12-31" },
    });
    expect(data.series[0].key).toBe("2025-01");
    expect(data.series[11].key).toBe("2025-12");
  });
});
