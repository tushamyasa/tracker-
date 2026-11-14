import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { categories, transactions, users } from "@/db/schema";
import { verifyCredentials } from "@/server/auth/credentials";
import { changePassword, deleteAccount, getUserCurrency, updateCurrency } from "./account";
import { csvCell, transactionsToCsv } from "./csv";
import { getBreakdown } from "./reports";
import { listTransactions } from "./transactions";
import { createTestDb, createTestUser } from "./test-utils";

let db: Db;
let userA: string;
let userB: string;

beforeEach(async () => {
  db = await createTestDb();
  userA = await createTestUser(db, "a@example.com");
  userB = await createTestUser(db, "b@example.com");
});

async function add(userId: string, catName: string, type: "income" | "expense", amount: number, date: string, note?: string) {
  const [c] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.name, catName), eq(categories.type, type)));
  await db.insert(transactions).values({ userId, categoryId: c.id, type, amount, date, note });
}

describe("csvCell", () => {
  it("экранирует кавычки, разделители и переводы строк", () => {
    expect(csvCell("простой")).toBe("простой");
    expect(csvCell('a"b')).toBe('"a""b"');
    expect(csvCell("a;b")).toBe('"a;b"');
    expect(csvCell("a\nb")).toBe('"a\nb"');
  });

  it.each(["=SUM(A1)", "+1", "-1", "@cmd", "\tx"])("защищает от formula injection: %j", (v) => {
    expect(csvCell(v).startsWith("'") || csvCell(v).startsWith('"\'')).toBe(true);
  });
});

describe("transactionsToCsv / экспорт", () => {
  it("формирует CSV с BOM, расходы отрицательные, данные только пользователя", async () => {
    await add(userA, "Зарплата", "income", 100050, "2026-11-05", "Аванс");
    await add(userA, "Продукты", "expense", 123456, "2026-11-06", '=HYPERLINK("x")');
    await add(userB, "Продукты", "expense", 999, "2026-11-06", "чужая");

    const { rows } = await listTransactions(db, userA, {}, 50000);
    const csv = transactionsToCsv(rows);
    const lines = csv.replace("﻿", "").trim().split("\r\n");

    expect(csv.startsWith("﻿")).toBe(true);
    expect(lines[0]).toBe("Дата;Тип;Категория;Сумма (RUB);Заметка");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toBe("06.11.2026;Расход;Продукты;-1234,56;\"'=HYPERLINK(\"\"x\"\")\"");
    expect(lines[2]).toBe("05.11.2026;Доход;Зарплата;1000,50;Аванс");
    expect(csv).not.toContain("чужая");
  });

  it("пустой список → только заголовок", () => {
    expect(transactionsToCsv([]).replace("﻿", "").trim().split("\r\n")).toHaveLength(1);
  });
});

describe("getBreakdown", () => {
  it("группирует по категориям с количеством и процентами", async () => {
    await add(userA, "Продукты", "expense", 3000, "2026-11-02");
    await add(userA, "Продукты", "expense", 1000, "2026-11-03");
    await add(userA, "Транспорт", "expense", 4000, "2026-11-04");
    await add(userA, "Зарплата", "income", 50000, "2026-11-04");
    await add(userA, "Продукты", "expense", 777, "2026-10-04"); // вне периода
    await add(userB, "Продукты", "expense", 777, "2026-11-04"); // чужое

    const range = { from: "2026-11-01", to: "2026-11-30" };
    const exp = await getBreakdown(db, userA, range, "expense");
    expect(exp.total).toBe(8000);
    expect(exp.rows.map((r) => [r.name, r.amount, r.count, r.percent])).toEqual([
      ["Продукты", 4000, 2, 50],
      ["Транспорт", 4000, 1, 50],
    ]);
    const inc = await getBreakdown(db, userA, range, "income");
    expect(inc.rows).toHaveLength(1);
    expect(inc.total).toBe(50000);
  });

  it("пустой период", async () => {
    expect(await getBreakdown(db, userA, { from: "2026-01-01", to: "2026-01-31" }, "expense")).toEqual({
      rows: [],
      total: 0,
    });
  });
});

describe("аккаунт", () => {
  it("меняет валюту", async () => {
    expect(await getUserCurrency(db, userA)).toBe("RUB");
    await updateCurrency(db, userA, "EUR");
    expect(await getUserCurrency(db, userA)).toBe("EUR");
    expect(await getUserCurrency(db, userB)).toBe("RUB");
  });

  it("меняет пароль только при верном текущем", async () => {
    expect(await changePassword(db, userA, "wrong", "new-password-1")).toEqual({ ok: false, error: "wrong_password" });
    expect(await changePassword(db, userA, "password123", "new-password-1")).toEqual({ ok: true });
    expect(await verifyCredentials(db, "a@example.com", "new-password-1")).not.toBeNull();
    expect(await verifyCredentials(db, "a@example.com", "password123")).toBeNull();
  });

  it("удаляет аккаунт со всеми данными, не трогая чужие", async () => {
    await add(userA, "Продукты", "expense", 100, "2026-11-01");
    await add(userB, "Продукты", "expense", 200, "2026-11-01");

    expect(await deleteAccount(db, userA, "wrong")).toEqual({ ok: false, error: "wrong_password" });
    expect(await db.select().from(users)).toHaveLength(2);

    expect(await deleteAccount(db, userA, "password123")).toEqual({ ok: true });
    expect(await db.select().from(users).where(eq(users.id, userA))).toHaveLength(0);
    expect(await db.select().from(categories).where(eq(categories.userId, userA))).toHaveLength(0);
    expect(await db.select().from(transactions).where(eq(transactions.userId, userA))).toHaveLength(0);
    // данные второго пользователя целы
    expect(await db.select().from(categories).where(eq(categories.userId, userB))).toHaveLength(17);
    expect(await db.select().from(transactions).where(eq(transactions.userId, userB))).toHaveLength(1);
  });
});
