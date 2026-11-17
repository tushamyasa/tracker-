"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { sniffImage } from "@/lib/image-sniff";
import { syncAchievements } from "@/lib/gamification-data";
import { EQUIPMENT, KINDS, MUSCLE_GROUPS } from "@/lib/exercises";
import { requireUser } from "@/server/auth/session";
import { deleteImage, MAX_IMAGE_BYTES, saveImage } from "@/server/media";
import type { FormState } from "./auth";

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  muscleGroup: z.enum(MUSCLE_GROUPS),
  equipment: z.enum(EQUIPMENT),
  kind: z.enum(KINDS),
  description: z
    .string()
    .trim()
    .max(1000)
    .transform((v) => v || null),
});

function parse(formData: FormData) {
  return schema.safeParse({
    name: formData.get("name"),
    muscleGroup: formData.get("muscleGroup"),
    equipment: formData.get("equipment"),
    kind: formData.get("kind"),
    description: formData.get("description") ?? "",
  });
}

function photoOf(formData: FormData): File | null {
  const f = formData.get("photo");
  return f instanceof File && f.size > 0 ? f : null;
}

async function photoError(file: File | null): Promise<string | null> {
  if (!file) return null;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "bad_image_type";
  if (file.size > MAX_IMAGE_BYTES) return "image_too_big";
  // Содержимое проверяем по сигнатуре: MIME-тип в запросе задаёт клиент.
  const ext = sniffImage(new Uint8Array(await file.arrayBuffer()));
  if (!ext) return "bad_image_type";
  return null;
}

export async function createExercise(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) return { error: "invalid" };
  const photo = photoOf(formData);
  const err = await photoError(photo);
  if (err) return { error: err };

  const { name, ...rest } = parsed.data;
  const created = await db.exercise.create({
    data: {
      ...rest,
      nameRu: name,
      nameEn: name,
      ownerId: user.id,
      mediaUrl: photo ? await saveImage(photo) : null,
    },
  });
  await syncAchievements(user.id, user.weeklyGoal, null);
  revalidatePath("/exercises");
  redirect(`/exercises/${created.id}`);
}

export async function updateExercise(
  id: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  // Проверка владельца: системные и чужие упражнения менять нельзя.
  const existing = await db.exercise.findFirst({ where: { id, ownerId: user.id } });
  if (!existing) return { error: "not_found" };

  const parsed = parse(formData);
  if (!parsed.success) return { error: "invalid" };
  const photo = photoOf(formData);
  const err = await photoError(photo);
  if (err) return { error: err };

  const { name, ...rest } = parsed.data;
  let mediaUrl = existing.mediaUrl;
  if (formData.get("removePhoto") === "on" && !photo) {
    await deleteImage(existing.mediaUrl);
    mediaUrl = null;
  }
  if (photo) {
    await deleteImage(existing.mediaUrl);
    mediaUrl = await saveImage(photo);
  }
  await db.exercise.update({
    where: { id },
    data: { ...rest, nameRu: name, nameEn: name, mediaUrl },
  });
  revalidatePath("/exercises");
  redirect(`/exercises/${id}`);
}

export async function deleteExercise(id: string) {
  const user = await requireUser();
  const existing = await db.exercise.findFirst({ where: { id, ownerId: user.id } });
  if (!existing) return;
  // Упражнение из истории тренировок удалять нельзя: пропали бы записанные подходы.
  const used = await db.workoutExercise.count({ where: { exerciseId: id } });
  if (used > 0) redirect(`/exercises/${id}?error=in_use`);
  await db.exercise.delete({ where: { id } });
  await deleteImage(existing.mediaUrl);
  revalidatePath("/exercises");
  redirect("/exercises");
}

export async function toggleFavorite(exerciseId: string) {
  const user = await requireUser();
  // Избранное можно ставить только на доступные пользователю упражнения.
  const accessible = await db.exercise.findFirst({
    where: { id: exerciseId, OR: [{ ownerId: null }, { ownerId: user.id }] },
    select: { id: true },
  });
  if (!accessible) return;
  const key = { userId_exerciseId: { userId: user.id, exerciseId } };
  const existing = await db.favoriteExercise.findUnique({ where: key });
  if (existing) await db.favoriteExercise.delete({ where: key });
  else await db.favoriteExercise.create({ data: { userId: user.id, exerciseId } });
  revalidatePath("/exercises");
  revalidatePath(`/exercises/${exerciseId}`);
}
