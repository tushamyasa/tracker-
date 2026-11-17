import "server-only";
import { db } from "@/lib/db";
import { exerciseName } from "@/lib/exercises";

/** Упражнения, доступные пользователю, для выбора в редакторе шаблона. */
export async function pickerExercises(userId: string, locale: string) {
  const all = await db.exercise.findMany({
    where: { OR: [{ ownerId: null }, { ownerId: userId }] },
    select: {
      id: true,
      nameRu: true,
      nameEn: true,
      muscleGroup: true,
      kind: true,
      equipment: true,
    },
  });
  return all
    .map((e) => ({ ...e, name: exerciseName(e, locale) }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}
