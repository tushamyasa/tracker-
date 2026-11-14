import { and, between, eq, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { categories, transactions, type TransactionType } from "@/db/schema";
import type { DateRange } from "@/lib/dates";

export type BreakdownRow = {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  count: number;
  percent: number;
};

/** Разбивка по категориям одного типа за период (все категории, по убыванию суммы). */
export async function getBreakdown(
  db: Db,
  userId: string,
  range: DateRange,
  type: TransactionType,
): Promise<{ rows: BreakdownRow[]; total: number }> {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      icon: categories.icon,
      color: categories.color,
      amount: sql<number>`sum(${transactions.amount})`,
      count: sql<number>`count(*)`,
    })
    .from(transactions)
    .innerJoin(categories, eq(categories.id, transactions.categoryId))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, type),
        between(transactions.date, range.from, range.to),
      ),
    )
    .groupBy(categories.id)
    .orderBy(sql`sum(${transactions.amount}) desc`, categories.name);

  const total = rows.reduce((s, r) => s + Number(r.amount), 0);
  return {
    total,
    rows: rows.map((r) => ({
      ...r,
      amount: Number(r.amount),
      count: Number(r.count),
      percent: total ? Math.round((Number(r.amount) / total) * 1000) / 10 : 0,
    })),
  };
}
