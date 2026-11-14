"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { transactionInputSchema } from "@/lib/validators/transaction";
import * as logic from "@/server/transactions";
import { requireUserId } from "@/server/session";

export type TransactionFieldErrors = Partial<
  Record<"type" | "amount" | "categoryId" | "date" | "note", string>
>;

export type TransactionActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: TransactionFieldErrors };

const ERROR_TEXT: Record<logic.TransactionError, string> = {
  not_found: "Операция не найдена",
  category_not_found: "Категория не найдена",
  type_mismatch: "Категория не подходит к типу операции",
  category_archived: "Эта категория в архиве — выберите другую",
};

function validationFail(e: z.ZodError): TransactionActionResult {
  const fieldErrors: TransactionFieldErrors = {};
  for (const issue of e.issues) {
    const k = issue.path[0] as keyof TransactionFieldErrors | undefined;
    if (k && !fieldErrors[k]) fieldErrors[k] = issue.message;
  }
  return { ok: false, error: "Проверьте поля формы", fieldErrors };
}

const refresh = () => {
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/categories");
  revalidatePath("/reports");
};

export async function createTransactionAction(input: unknown): Promise<TransactionActionResult> {
  const userId = await requireUserId();
  const parsed = transactionInputSchema.safeParse(input);
  if (!parsed.success) return validationFail(parsed.error);

  const r = await logic.createTransaction(db, userId, parsed.data);
  if (!r.ok) return { ok: false, error: ERROR_TEXT[r.error] };
  refresh();
  return { ok: true };
}

export async function updateTransactionAction(
  id: string,
  input: unknown,
): Promise<TransactionActionResult> {
  const userId = await requireUserId();
  const parsed = transactionInputSchema.safeParse(input);
  if (!parsed.success) return validationFail(parsed.error);

  const r = await logic.updateTransaction(db, userId, String(id), parsed.data);
  if (!r.ok) return { ok: false, error: ERROR_TEXT[r.error] };
  refresh();
  return { ok: true };
}

export async function deleteTransactionAction(id: string): Promise<TransactionActionResult> {
  const userId = await requireUserId();
  const r = await logic.deleteTransaction(db, userId, String(id));
  if (!r.ok) return { ok: false, error: ERROR_TEXT[r.error] };
  refresh();
  return { ok: true };
}

/** Категории для формы операции (загружаются при открытии drawer). */
export async function listFormCategoriesAction(): Promise<logic.FormCategory[]> {
  const userId = await requireUserId();
  return logic.listFormCategories(db, userId);
}
