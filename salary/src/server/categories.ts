import { and, count, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { categories, transactions, type Category } from "@/db/schema";
import type { CategoryInput, CategoryUpdateInput } from "@/lib/validators/category";

/**
 * Бизнес-логика категорий. Каждая функция принимает userId и ограничивает
 * запросы им — доступа к чужим категориям нет по построению.
 */

export type CategoryWithCount = Category & { txCount: number };

export type CategoryError = "duplicate" | "not_found" | "has_transactions" | "invalid_target";

export type CategoryResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: CategoryError; count?: number };

export async function listCategories(db: Db, userId: string): Promise<CategoryWithCount[]> {
  const rows = await db
    .select({ category: categories, txCount: count(transactions.id) })
    .from(categories)
    .leftJoin(transactions, eq(transactions.categoryId, categories.id))
    .where(eq(categories.userId, userId))
    .groupBy(categories.id)
    .orderBy(categories.name);
  return rows.map((r) => ({ ...r.category, txCount: r.txCount }));
}

async function findOwned(db: Db, userId: string, id: string): Promise<Category | undefined> {
  const [row] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .limit(1);
  return row;
}

/** Регистронезависимая проверка (SQLite lower() не работает с кириллицей, делаем в JS). */
async function nameTaken(
  db: Db,
  userId: string,
  type: Category["type"],
  name: string,
  exceptId?: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.type, type)));
  const target = name.trim().toLowerCase();
  return rows.some((r) => r.id !== exceptId && r.name.toLowerCase() === target);
}

export async function createCategory(
  db: Db,
  userId: string,
  input: CategoryInput,
): Promise<CategoryResult<Category>> {
  if (await nameTaken(db, userId, input.type, input.name)) {
    return { ok: false, error: "duplicate" };
  }
  const [row] = await db
    .insert(categories)
    .values({ ...input, userId })
    .returning();
  return { ok: true, data: row };
}

export async function updateCategory(
  db: Db,
  userId: string,
  id: string,
  input: CategoryUpdateInput,
): Promise<CategoryResult<Category>> {
  const existing = await findOwned(db, userId, id);
  if (!existing) return { ok: false, error: "not_found" };
  if (await nameTaken(db, userId, existing.type, input.name, id)) {
    return { ok: false, error: "duplicate" };
  }
  const [row] = await db
    .update(categories)
    .set(input)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .returning();
  return { ok: true, data: row };
}

export async function setCategoryArchived(
  db: Db,
  userId: string,
  id: string,
  archived: boolean,
): Promise<CategoryResult> {
  const result = await db
    .update(categories)
    .set({ isArchived: archived })
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .returning({ id: categories.id });
  return result.length ? { ok: true } : { ok: false, error: "not_found" };
}

/**
 * Удаляет категорию. Если есть операции — требует reassignTo (категория того же
 * типа и пользователя), куда они переносятся атомарно вместе с удалением.
 */
export async function deleteCategory(
  db: Db,
  userId: string,
  id: string,
  opts: { reassignTo?: string } = {},
): Promise<CategoryResult> {
  const existing = await findOwned(db, userId, id);
  if (!existing) return { ok: false, error: "not_found" };

  const [{ n }] = await db
    .select({ n: count() })
    .from(transactions)
    .where(and(eq(transactions.categoryId, id), eq(transactions.userId, userId)));

  if (n === 0) {
    await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return { ok: true };
  }

  if (!opts.reassignTo) return { ok: false, error: "has_transactions", count: n };

  const target = await findOwned(db, userId, opts.reassignTo);
  if (!target || target.id === id || target.type !== existing.type) {
    return { ok: false, error: "invalid_target" };
  }

  await db.batch([
    db
      .update(transactions)
      .set({ categoryId: target.id, updatedAt: Date.now() })
      .where(and(eq(transactions.categoryId, id), eq(transactions.userId, userId))),
    db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId))),
  ]);
  return { ok: true };
}
