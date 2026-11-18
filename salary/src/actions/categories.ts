"use server";

import { and, asc, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories, transactions, type Category } from "@/db/schema";
import { categorySchema, type CategoryInput } from "@/lib/category-validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Не авторизован");
  return session.user.id;
}

/** Категории текущего пользователя (с количеством операций). */
export async function getCategories(): Promise<(Category & { txCount: number })[]> {
  const userId = await requireUserId();
  const rows = await db
    .select({ category: categories, txCount: count(transactions.id) })
    .from(categories)
    .leftJoin(transactions, eq(transactions.categoryId, categories.id))
    .where(eq(categories.userId, userId))
    .groupBy(categories.id)
    .orderBy(asc(categories.createdAt), asc(categories.name));
  return rows.map((r) => ({ ...r.category, txCount: r.txCount }));
}

async function nameTaken(userId: string, type: "income" | "expense", name: string, exceptId?: string) {
  const rows = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.type, type)));
  return rows.some((r) => r.id !== exceptId && r.name.toLowerCase() === name.toLowerCase());
}

export async function createCategory(input: CategoryInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  if (await nameTaken(userId, parsed.data.type, parsed.data.name)) {
    return { ok: false, error: "Категория с таким названием уже есть" };
  }
  await db.insert(categories).values({ ...parsed.data, userId });
  revalidatePath("/categories");
  return { ok: true };
}

export async function updateCategory(id: string, input: CategoryInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const existing = await db.query.categories.findFirst({
    where: and(eq(categories.id, id), eq(categories.userId, userId)),
  });
  if (!existing) return { ok: false, error: "Категория не найдена" };
  if (existing.type !== parsed.data.type) {
    const used = await db.$count(transactions, eq(transactions.categoryId, id));
    if (used > 0) return { ok: false, error: "Нельзя сменить тип категории с операциями" };
  }
  if (await nameTaken(userId, parsed.data.type, parsed.data.name, id)) {
    return { ok: false, error: "Категория с таким названием уже есть" };
  }
  await db
    .update(categories)
    .set(parsed.data)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));
  revalidatePath("/categories");
  return { ok: true };
}

/**
 * Безопасное удаление. Если у категории есть операции, нужно выбрать стратегию:
 * "move" — перенести в категорию «Другое» того же типа, "delete" — удалить вместе с операциями.
 */
export async function deleteCategory(
  id: string,
  strategy?: "move" | "delete",
): Promise<ActionResult | { ok: false; error: string; needsStrategy: true; txCount: number }> {
  const userId = await requireUserId();
  const cat = await db.query.categories.findFirst({
    where: and(eq(categories.id, id), eq(categories.userId, userId)),
  });
  if (!cat) return { ok: false, error: "Категория не найдена" };

  const txCount = await db.$count(transactions, eq(transactions.categoryId, id));
  if (txCount > 0 && !strategy) {
    return { ok: false, error: "У категории есть операции", needsStrategy: true, txCount };
  }

  await db.transaction(async (tx) => {
    if (txCount > 0 && strategy === "move") {
      const sameType = await tx
        .select()
        .from(categories)
        .where(and(eq(categories.userId, userId), eq(categories.type, cat.type)));
      let target = sameType.find((c) => c.id !== id && c.name === "Другое");
      if (!target) {
        [target] = await tx
          .insert(categories)
          .values({ userId, name: "Другое", type: cat.type, color: "#64748B", icon: "ellipsis", isDefault: true })
          .returning();
      }
      await tx
        .update(transactions)
        .set({ categoryId: target.id })
        .where(and(eq(transactions.categoryId, id), eq(transactions.userId, userId)));
    } else if (txCount > 0 && strategy === "delete") {
      await tx.delete(transactions).where(and(eq(transactions.categoryId, id), eq(transactions.userId, userId)));
    }
    await tx.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
  });

  revalidatePath("/categories");
  return { ok: true };
}
