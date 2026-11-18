"use server";

import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories, transactions } from "@/db/schema";
import { monthShort, monthStart, parseMonth, shiftMonth, toYm } from "@/lib/month";
import type { TransactionRow } from "./transactions";

export type DashboardData = {
  year: number;
  month: number;
  isCurrentMonth: boolean;
  balance: number;
  income: number;
  expense: number;
  prevIncome: number;
  prevExpense: number;
  byCategory: { id: string | null; name: string; color: string; value: number }[];
  monthly: { label: string; income: number; expense: number }[];
  recent: TransactionRow[];
};

async function readTz(): Promise<number> {
  const raw = (await cookies()).get("tz")?.value;
  const n = Number(raw);
  return Number.isFinite(n) && Math.abs(n) <= 14 * 60 ? n : 0;
}

export async function getDashboardData(ym?: string): Promise<DashboardData> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Не авторизован");

  const tz = await readTz();
  const { year, month } = parseMonth(ym, tz);
  const cur = parseMonth(undefined, tz);
  const isCurrentMonth = cur.year === year && cur.month === month;

  const secs = (ms: number) => new Date(ms);
  const start = monthStart(year, month, tz);
  const end = monthStart(year, month + 1, tz);
  const prev = shiftMonth(year, month, -1);
  const prevStart = monthStart(prev.year, prev.month, tz);
  const first6 = shiftMonth(year, month, -5);
  const firstStart = monthStart(first6.year, first6.month, tz);

  const mine = eq(transactions.userId, userId);
  const sumBy = (type: "income" | "expense") =>
    sql<number>`coalesce(sum(case when ${transactions.type} = ${type} then ${transactions.amount} else 0 end), 0)`;

  // Общий баланс на конец выбранного месяца (для текущего — на сейчас)
  const [total] = await db
    .select({ income: sumBy("income"), expense: sumBy("expense") })
    .from(transactions)
    .where(and(mine, lt(transactions.date, secs(end))));

  // Помесячные суммы за 6 месяцев по локальному времени пользователя
  const monthKey = sql<string>`strftime('%Y-%m', ${transactions.date} - ${tz * 60}, 'unixepoch')`;
  const monthlyRows = await db
    .select({ ym: monthKey, income: sumBy("income"), expense: sumBy("expense") })
    .from(transactions)
    .where(and(mine, gte(transactions.date, secs(firstStart)), lt(transactions.date, secs(end))))
    .groupBy(monthKey);
  const byYm = new Map(monthlyRows.map((r) => [r.ym, r]));

  const monthly = Array.from({ length: 6 }, (_, i) => {
    const m = shiftMonth(first6.year, first6.month, i);
    const r = byYm.get(toYm(m.year, m.month));
    return { label: monthShort(m.month), income: r?.income ?? 0, expense: r?.expense ?? 0 };
  });
  const curRow = byYm.get(toYm(year, month));
  const prevRow = byYm.get(toYm(prev.year, prev.month));

  const catRows = await db
    .select({
      id: transactions.categoryId,
      name: categories.name,
      color: categories.color,
      value: sql<number>`sum(${transactions.amount})`,
    })
    .from(transactions)
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .where(and(mine, eq(transactions.type, "expense"), gte(transactions.date, secs(start)), lt(transactions.date, secs(end))))
    .groupBy(transactions.categoryId)
    .orderBy(desc(sql`sum(${transactions.amount})`));

  const recent = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      amount: transactions.amount,
      date: transactions.date,
      note: transactions.note,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      categoryIcon: categories.icon,
    })
    .from(transactions)
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .where(mine)
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .limit(5);

  return {
    year,
    month,
    isCurrentMonth,
    balance: (total?.income ?? 0) - (total?.expense ?? 0),
    income: curRow?.income ?? 0,
    expense: curRow?.expense ?? 0,
    prevIncome: prevRow?.income ?? 0,
    prevExpense: prevRow?.expense ?? 0,
    byCategory: catRows.map((r) => ({
      id: r.id,
      name: r.name ?? "Без категории",
      color: r.color ?? "#64748B",
      value: r.value,
    })),
    monthly,
    recent,
  };
}
