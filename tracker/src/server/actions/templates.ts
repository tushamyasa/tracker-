"use server";

import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { STARTERS } from "@/lib/templates";
import { requireUser } from "@/server/auth/session";
import type { FormState } from "./auth";

const payloadSchema = z.object({
  name: z.string().trim().min(1).max(80),
  note: z
    .string()
    .trim()
    .max(500)
    .transform((v) => v || null),
  weekday: z.number().int().min(0).max(6).nullable(),
  folderId: z.string().nullable(),
  items: z
    .array(
      z.object({
        exerciseId: z.string().min(1),
        sets: z.number().int().min(1).max(20),
        reps: z.number().int().min(1).max(100),
      }),
    )
    .max(40),
});

export async function saveTemplate(
  id: string | null,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: "invalid" };
  }
  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) return { error: "invalid" };
  const data = parsed.data;
  if (data.items.length === 0) return { error: "template_empty" };

  // Папка должна принадлежать пользователю.
  if (data.folderId) {
    const folder = await db.folder.findFirst({ where: { id: data.folderId, userId: user.id } });
    if (!folder) return { error: "not_found" };
  }
  // Упражнения: только системные или собственные.
  const ids = [...new Set(data.items.map((i) => i.exerciseId))];
  const accessible = await db.exercise.count({
    where: { id: { in: ids }, OR: [{ ownerId: null }, { ownerId: user.id }] },
  });
  if (accessible !== ids.length) return { error: "not_found" };

  if (id) {
    const existing = await db.template.findFirst({ where: { id, userId: user.id } });
    if (!existing) return { error: "not_found" };
  }

  const fields = {
    name: data.name,
    note: data.note,
    weekday: data.weekday,
    folderId: data.folderId,
  };
  const items = data.items.map((i, order) => ({
    exerciseId: i.exerciseId,
    order,
    targetSets: i.sets,
    targetReps: i.reps,
  }));

  await db.$transaction(async (tx) => {
    if (id) {
      await tx.template.update({ where: { id }, data: fields });
      await tx.templateExercise.deleteMany({ where: { templateId: id } });
      await tx.templateExercise.createMany({
        data: items.map((i) => ({ ...i, templateId: id })),
      });
    } else {
      await tx.template.create({
        data: { ...fields, userId: user.id, items: { create: items } },
      });
    }
  });
  revalidatePath("/templates");
  redirect("/templates");
}

export async function duplicateTemplate(id: string) {
  const user = await requireUser();
  const src = await db.template.findFirst({
    where: { id, userId: user.id },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!src) return;
  const suffix = (await getLocale()) === "en" ? "copy" : "копия";
  await db.template.create({
    data: {
      userId: user.id,
      name: `${src.name} (${suffix})`.slice(0, 80),
      note: src.note,
      weekday: null,
      folderId: src.folderId,
      items: {
        create: src.items.map((i) => ({
          exerciseId: i.exerciseId,
          order: i.order,
          targetSets: i.targetSets,
          targetReps: i.targetReps,
        })),
      },
    },
  });
  revalidatePath("/templates");
}

export async function deleteTemplate(id: string) {
  const user = await requireUser();
  await db.template.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/templates");
  redirect("/templates");
}

export async function createFolder(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = z.string().trim().min(1).max(40).safeParse(formData.get("name"));
  if (!name.success) return { error: "invalid" };
  await db.folder.create({ data: { userId: user.id, name: name.data } });
  revalidatePath("/templates");
  return undefined;
}

export async function deleteFolder(id: string) {
  const user = await requireUser();
  // Шаблоны из папки не удаляются: folderId обнуляется (onDelete: SetNull).
  await db.folder.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/templates");
}

export async function addStarterTemplate(key: string) {
  const user = await requireUser();
  const starter = STARTERS.find((s) => s.key === key);
  if (!starter) return;
  const locale = await getLocale();
  const exercises = await db.exercise.findMany({
    where: { slug: { in: starter.items.map((i) => i[0]) } },
    select: { id: true, slug: true },
  });
  const idBySlug = new Map(exercises.map((e) => [e.slug, e.id]));
  const items = starter.items
    .filter(([slug]) => idBySlug.has(slug))
    .map(([slug, sets, reps], order) => ({
      exerciseId: idBySlug.get(slug)!,
      order,
      targetSets: sets,
      targetReps: reps,
    }));
  if (items.length === 0) return;
  await db.template.create({
    data: {
      userId: user.id,
      name: locale === "en" ? starter.nameEn : starter.nameRu,
      items: { create: items },
    },
  });
  revalidatePath("/templates");
}
