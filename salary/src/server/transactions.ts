import { and, desc, eq, gte, lte, or, sql, type SQL } from "drizzle-orm";
import type { Db } from "@/db/client";
import { categories, transactions, type Transaction } from "@/db/schema";
import type { TransactionFilters, TransactionInput } from "@/lib/validators/transaction";

export const PAGE_SIZE = 25;

export type TransactionError =
  | "not_found"
  | "category_not_found"
  | "type_mismatch"
  | "category_archived";

export type TransactionRow = Transaction & {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
};

export type TransactionList = {
  rows: TransactionRow[];
  total: number;
  page: number;
  pageSize: number;
  totals: { income: number; expense: number };
};

/** Экранирование спецсимволов LIKE. */
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * LIKE в SQLite регистронезависим только для ASCII. Для кириллицы проверяем
 * три варианта написания: как введено, нижний регистр, с заглавной буквы.
 */
function searchCondition(q: string): SQL {
  const variants = new Set([q, q.toLowerCase(), q.charAt(0).toUpperCase() + q.slice(1).toLowerCase()]);
  const conds = [...variants].map(
    (v) => sql`${transactions.note} LIKE ${`%${escapeLike(v)}%`} ESCAPE '\\'`,
  );
  return or(...conds) as SQL;
}

function buildWhere(userId: string, f: Partial<TransactionFilters>): SQL {
  const conds: (SQL | undefined)[] = [eq(transactions.userId, userId)];
  if (f.from) conds.push(gte(transactions.date, f.from));
  if (f.to) conds.push(lte(transactions.date, f.to));
  if (f.type) conds.push(eq(transactions.type, f.type));
  if (f.categoryId) conds.push(eq(transactions.categoryId, f.categoryId));
  if (f.q) conds.push(searchCondition(f.q));
  return and(...conds) as SQL;
}

export async function listTransactions(
  db: Db,
  userId: string,
  filters: Partial<TransactionFilters> = {},
  pageSize = PAGE_SIZE,
): Promise<TransactionList> {
  const where = buildWhere(userId, filters);
  const page = filters.page ?? 1;

  const rows = await db
    .select({
      tx: transactions,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
    })
    .from(transactions)
    .innerJoin(categories, eq(categories.id, transactions.categoryId))
    .where(where)
    .orderBy(desc(transactions.date), desc(transactions.createdAt), desc(transactions.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [agg] = await db
    .select({
      total: sql<number>`count(*)`,
      income: sql<number>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.amount} end), 0)`,
      expense: sql<number>`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.amount} end), 0)`,
    })
    .from(transactions)
    .where(where);

  return {
    rows: rows.map((r) => ({
      ...r.tx,
      categoryName: r.categoryName,
      categoryIcon: r.categoryIcon,
      categoryColor: r.categoryColor,
    })),
    total: Number(agg.total),
    page,
    pageSize,
    totals: { income: Number(agg.income), expense: Number(agg.expense) },
  };
}

type TxResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: TransactionError };

async function checkCategory(
  db: Db,
  userId: string,
  input: TransactionInput,
  opts: { allowArchivedId?: string } = {},
): Promise<TransactionError | null> {
  const [cat] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, input.categoryId), eq(categories.userId, userId)))
    .limit(1);
  if (!cat) return "category_not_found";
  if (cat.type !== input.type) return "type_mismatch";
  if (cat.isArchived && cat.id !== opts.allowArchivedId) return "category_archived";
  return null;
}

export async function createTransaction(
  db: Db,
  userId: string,
  input: TransactionInput,
): Promise<TxResult<Transaction>> {
  const error = await checkCategory(db, userId, input);
  if (error) return { ok: false, error };
  const [row] = await db
    .insert(transactions)
    .values({
      userId,
      categoryId: input.categoryId,
      type: input.type,
      amount: input.amount,
      date: input.date,
      note: input.note,
    })
    .returning();
  return { ok: true, data: row };
}

export async function updateTransaction(
  db: Db,
  userId: string,
  id: string,
  input: TransactionInput,
): Promise<TxResult<Transaction>> {
  const [existing] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .limit(1);
  if (!existing) return { ok: false, error: "not_found" };

  // оставить прежнюю (возможно архивную) категорию разрешено
  const error = await checkCategory(db, userId, input, { allowArchivedId: existing.categoryId });
  if (error) return { ok: false, error };

  const [row] = await db
    .update(transactions)
    .set({
      categoryId: input.categoryId,
      type: input.type,
      amount: input.amount,
      date: input.date,
      note: input.note,
      updatedAt: Date.now(),
    })
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning();
  return { ok: true, data: row };
}

export async function deleteTransaction(db: Db, userId: string, id: string): Promise<TxResult> {
  const res = await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning({ id: transactions.id });
  return res.length ? { ok: true } : { ok: false, error: "not_found" };
}

/** Активные категории для формы операции. */
export async function listFormCategories(db: Db, userId: string) {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      type: categories.type,
      icon: categories.icon,
      color: categories.color,
    })
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.isArchived, false)))
    .orderBy(categories.name);
}

export type FormCategory = Awaited<ReturnType<typeof listFormCategories>>[number];
