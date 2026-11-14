"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { categoryInputSchema, categoryUpdateSchema } from "@/lib/validators/category";
import * as logic from "@/server/categories";
import { requireUserId } from "@/server/session";

export type CategoryActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Partial<Record<"name" | "icon" | "color", string>>; count?: number };

const ERROR_TEXT: Record<logic.CategoryError, string> = {
  duplicate: "Категория с таким названием уже есть",
  not_found: "Категория не найдена",
  has_transactions: "В категории есть операции — выберите, куда их перенести",
  invalid_target: "Нельзя перенести операции в выбранную категорию",
};

const fail = (error: logic.CategoryError, count?: number): CategoryActionResult => ({
  ok: false,
  error: ERROR_TEXT[error],
  count,
  ...(error === "duplicate" ? { fieldErrors: { name: ERROR_TEXT.duplicate } } : {}),
});

function validationFail(e: z.ZodError): CategoryActionResult {
  const fieldErrors: NonNullable<Extract<CategoryActionResult, { ok: false }>["fieldErrors"]> = {};
  for (const issue of e.issues) {
    const k = issue.path[0];
    if ((k === "name" || k === "icon" || k === "color") && !fieldErrors[k]) {
      fieldErrors[k] = issue.message;
    }
  }
  return { ok: false, error: "Проверьте поля формы", fieldErrors };
}

const refresh = () => {
  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
};

export async function createCategoryAction(input: unknown): Promise<CategoryActionResult> {
  const userId = await requireUserId();
  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) return validationFail(parsed.error);

  const r = await logic.createCategory(db, userId, parsed.data);
  if (!r.ok) return fail(r.error);
  refresh();
  return { ok: true };
}

export async function updateCategoryAction(id: string, input: unknown): Promise<CategoryActionResult> {
  const userId = await requireUserId();
  const parsed = categoryUpdateSchema.safeParse(input);
  if (!parsed.success) return validationFail(parsed.error);

  const r = await logic.updateCategory(db, userId, String(id), parsed.data);
  if (!r.ok) return fail(r.error);
  refresh();
  return { ok: true };
}

export async function setCategoryArchivedAction(
  id: string,
  archived: boolean,
): Promise<CategoryActionResult> {
  const userId = await requireUserId();
  const r = await logic.setCategoryArchived(db, userId, String(id), Boolean(archived));
  if (!r.ok) return fail(r.error);
  refresh();
  return { ok: true };
}

export async function deleteCategoryAction(
  id: string,
  reassignTo?: string,
): Promise<CategoryActionResult> {
  const userId = await requireUserId();
  const r = await logic.deleteCategory(db, userId, String(id), {
    reassignTo: reassignTo ? String(reassignTo) : undefined,
  });
  if (!r.ok) return fail(r.error, r.count);
  refresh();
  return { ok: true };
}
