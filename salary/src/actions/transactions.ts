"use server";

import { and, asc, desc, eq, gte, inArray, lte, type SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories, transactions, users } from "@/db/schema";
import {
  filtersSchema,
  transactionSchema,
  type TransactionFilters,
  type TransactionInput,
} from "@/lib/transaction-validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type TransactionRow = {
  id: string;
  type: "income" | "expense";
  amount: number;
  date: Date;
  note: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  categoryIcon: string | null;
};

export type CategoryOption = {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
};

const LIMIT = 500;

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Не авторизован");
  return session.user.id;
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function getUserCurrency(): Promise<string> {
  const userId = await requireUserId();
  const u = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { currency: true } });
  return u?.currency ?? "RUB";
}

export async function getCategoryOptions(): Promise<CategoryOption[]> {
  const userId = await requireUserId();
  return db
    .select({
      id: categories.id,
      name: categories.name,
      type: categories.type,
      color: categories.color,
      icon: categories.icon,
    })
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.createdAt), asc(categories.name));
}

/** Операции текущего пользователя с фильтрами. Поиск по заметке — без учёта регистра (в т.ч. кириллицы). */
export async function getTransactions(
  raw: TransactionFilters = {},
): Promise<{ rows: TransactionRow[]; truncated: boolean }> {
  const userId = await requireUserId();
  const f = filtersSchema.parse(raw);

  const where: SQL[] = [eq(transactions.userId, userId)];
  if (f.type) where.push(eq(transactions.type, f.type));
  if (f.from !== undefined) where.push(gte(transactions.date, new Date(f.from)));
  if (f.to !== undefined) where.push(lte(transactions.date, new Date(f.to)));
  if (f.categoryIds?.length) where.push(inArray(transactions.categoryId, f.categoryIds));

  const rows = await db
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
    .where(and(...where))
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .limit(f.q ? 5000 : LIMIT + 1);

  const q = f.q?.toLowerCase();
  const filtered = q ? rows.filter((r) => r.note?.toLowerCase().includes(q)) : rows;
  return { rows: filtered.slice(0, LIMIT), truncated: filtered.length > LIMIT };
}

async function checkCategory(userId: string, categoryId: string, type: "income" | "expense") {
  const cat = await db.query.categories.findFirst({
    where: and(eq(categories.id, categoryId), eq(categories.userId, userId)),
  });
  if (!cat) return "Категория не найдена";
  if (cat.type !== type) return "Тип категории не совпадает с типом операции";
  return null;
}

export async function createTransaction(input: TransactionInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;
  const err = await checkCategory(userId, d.categoryId, d.type);
  if (err) return { ok: false, error: err };

  await db.insert(transactions).values({
    userId,
    type: d.type,
    amount: d.amount,
    categoryId: d.categoryId,
    date: new Date(d.date),
    note: d.note || null,
  });
  refresh();
  return { ok: true };
}

export async function updateTransaction(id: string, input: TransactionInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;
  const err = await checkCategory(userId, d.categoryId, d.type);
  if (err) return { ok: false, error: err };

  const res = await db
    .update(transactions)
    .set({
      type: d.type,
      amount: d.amount,
      categoryId: d.categoryId,
      date: new Date(d.date),
      note: d.note || null,
    })
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  if (res.rowsAffected === 0) return { ok: false, error: "Операция не найдена" };
  refresh();
  return { ok: true };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const res = await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  if (res.rowsAffected === 0) return { ok: false, error: "Операция не найдена" };
  refresh();
  return { ok: true };
}
