import { and, between, eq, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { categories, transactions } from "@/db/schema";
import { addMonths, type DateRange } from "@/lib/dates";
import { listTransactions, type TransactionRow } from "./transactions";

export type Summary = { income: number; expense: number; balance: number };
export type MonthPoint = { key: string; income: number; expense: number; balance: number };
export type CategorySlice = {
  id: string | null;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percent: number;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Доходы, расходы и баланс за период (включительно). */
export async function getSummary(db: Db, userId: string, range: DateRange): Promise<Summary> {
  const [row] = await db
    .select({
      income: sql<number>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.amount} end), 0)`,
      expense: sql<number>`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.amount} end), 0)`,
    })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), between(transactions.date, range.from, range.to)));
  const income = Number(row.income);
  const expense = Number(row.expense);
  return { income, expense, balance: income - expense };
}

/** `count` месяцев, заканчивая (endYear, endMonth); месяцы без операций дают нули. */
export async function getMonthlySeries(
  db: Db,
  userId: string,
  endYear: number,
  endMonth: number,
  count = 12,
): Promise<MonthPoint[]> {
  const first = addMonths(endYear, endMonth, -(count - 1));
  const from = `${String(first.year).padStart(4, "0")}-${pad(first.month)}-01`;
  const to = `${String(endYear).padStart(4, "0")}-${pad(endMonth)}-31`;

  const monthKey = sql<string>`substr(${transactions.date}, 1, 7)`;
  const rows = await db
    .select({
      key: monthKey,
      income: sql<number>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.amount} end), 0)`,
      expense: sql<number>`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.amount} end), 0)`,
    })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), between(transactions.date, from, to)))
    .groupBy(monthKey);

  const byKey = new Map(rows.map((r) => [r.key, r]));
  return Array.from({ length: count }, (_, i) => {
    const m = addMonths(first.year, first.month, i);
    const key = `${String(m.year).padStart(4, "0")}-${pad(m.month)}`;
    const r = byKey.get(key);
    const income = Number(r?.income ?? 0);
    const expense = Number(r?.expense ?? 0);
    return { key, income, expense, balance: income - expense };
  });
}

/** Расходы по категориям: топ-`top` + «Остальные». Проценты в сумме дают ~100. */
export async function getExpenseByCategory(
  db: Db,
  userId: string,
  range: DateRange,
  top = 8,
): Promise<CategorySlice[]> {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      icon: categories.icon,
      color: categories.color,
      amount: sql<number>`sum(${transactions.amount})`,
    })
    .from(transactions)
    .innerJoin(categories, eq(categories.id, transactions.categoryId))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        between(transactions.date, range.from, range.to),
      ),
    )
    .groupBy(categories.id)
    .orderBy(sql`sum(${transactions.amount}) desc`, categories.name);

  const total = rows.reduce((s, r) => s + Number(r.amount), 0);
  if (total === 0) return [];

  const pct = (amount: number) => Math.round((amount / total) * 1000) / 10;
  const head = rows.slice(0, top).map((r) => ({
    id: r.id as string | null,
    name: r.name,
    icon: r.icon,
    color: r.color,
    amount: Number(r.amount),
    percent: pct(Number(r.amount)),
  }));

  const rest = rows.slice(top);
  if (rest.length) {
    const amount = rest.reduce((s, r) => s + Number(r.amount), 0);
    head.push({ id: null, name: "Остальные", icon: "circle-ellipsis", color: "#64748B", amount, percent: pct(amount) });
  }
  return head;
}

export async function getRecentTransactions(
  db: Db,
  userId: string,
  limit = 10,
): Promise<TransactionRow[]> {
  return (await listTransactions(db, userId, {}, limit)).rows;
}

export type DashboardData = {
  summary: Summary;
  previous: Summary;
  series: MonthPoint[];
  byCategory: CategorySlice[];
  recent: TransactionRow[];
};

export async function getDashboardData(
  db: Db,
  userId: string,
  period: { range: DateRange; prevRange: DateRange; kind: "month" | "year"; year: number; month: number },
): Promise<DashboardData> {
  // для года график показывает 12 месяцев этого года, для месяца — последние 12 до него
  const endMonth = period.kind === "year" ? 12 : period.month;
  const [summary, previous, series, byCategory, recent] = await Promise.all([
    getSummary(db, userId, period.range),
    getSummary(db, userId, period.prevRange),
    getMonthlySeries(db, userId, period.year, endMonth, 12),
    getExpenseByCategory(db, userId, period.range),
    getRecentTransactions(db, userId, 10),
  ]);
  return { summary, previous, series, byCategory, recent };
}
