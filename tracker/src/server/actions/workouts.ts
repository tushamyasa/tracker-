"use server";

import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { syncAchievements } from "@/lib/gamification-data";
import { previousSets, toExerciseDTO } from "@/lib/workout-data";
import { workoutVolume, type SetValues, type WorkoutExerciseDTO } from "@/lib/workout-types";
import { requireUser } from "@/server/auth/session";

const EMPTY: SetValues = { type: "working", weightKg: 0, reps: 0, durationSec: 0, distanceKm: 0 };

/** Подставляет значения из прошлой тренировки (по номеру подхода) или целевые повторы. */
function prefill(prev: SetValues[], index: number, targetReps: number): SetValues {
  const p = prev[index] ?? prev[prev.length - 1];
  if (p) return { ...p, type: "working" };
  return { ...EMPTY, reps: targetReps };
}

export async function startWorkout(templateId: string | null) {
  const user = await requireUser();
  const locale = await getLocale();

  const active = await db.workout.findFirst({ where: { userId: user.id, status: "active" } });
  if (active) redirect("/workout/active");

  const tpl = templateId
    ? await db.template.findFirst({
        where: { id: templateId, userId: user.id },
        include: { items: { orderBy: { order: "asc" } } },
      })
    : null;
  if (templateId && !tpl) redirect("/templates");

  const prev = tpl
    ? await previousSets(
        user.id,
        tpl.items.map((i) => i.exerciseId),
      )
    : new Map<string, SetValues[]>();

  const fallbackName = locale === "en" ? "Workout" : "Тренировка";
  try {
    await db.workout.create({
      data: {
        userId: user.id,
        name: tpl?.name ?? fallbackName,
        templateId: tpl?.id ?? null,
        exercises: tpl
          ? {
              create: tpl.items.map((item, order) => ({
                exerciseId: item.exerciseId,
                order,
                sets: {
                  create: Array.from({ length: item.targetSets }, (_, i) => ({
                    order: i,
                    ...prefill(prev.get(item.exerciseId) ?? [], i, item.targetReps),
                  })),
                },
              })),
            }
          : undefined,
      },
    });
  } catch {
    // Параллельный старт: частичный уникальный индекс не даст создать вторую активную.
  }
  revalidatePath("/workout/active");
  redirect("/workout/active");
}

async function ownedActiveWorkout(userId: string, workoutId: string) {
  return db.workout.findFirst({ where: { id: workoutId, userId, status: "active" } });
}

export async function addExerciseToWorkout(
  workoutId: string,
  exerciseId: string,
): Promise<WorkoutExerciseDTO | null> {
  const user = await requireUser();
  const locale = await getLocale();
  const workout = await ownedActiveWorkout(user.id, workoutId);
  if (!workout) return null;
  const exercise = await db.exercise.findFirst({
    where: { id: exerciseId, OR: [{ ownerId: null }, { ownerId: user.id }] },
  });
  if (!exercise) return null;

  const last = await db.workoutExercise.findFirst({
    where: { workoutId },
    orderBy: { order: "desc" },
  });
  const prev = (await previousSets(user.id, [exerciseId], workoutId)).get(exerciseId) ?? [];
  const sets = Math.max(1, Math.min(prev.length, 3)) || 1;
  const we = await db.workoutExercise.create({
    data: {
      workoutId,
      exerciseId,
      order: (last?.order ?? -1) + 1,
      sets: {
        create: Array.from({ length: sets }, (_, i) => ({
          order: i,
          ...prefill(prev, i, 10),
        })),
      },
    },
  });
  return toExerciseDTO(user.id, workoutId, we.id, locale);
}

export async function removeWorkoutExercise(workoutId: string, id: string) {
  const user = await requireUser();
  if (!(await ownedActiveWorkout(user.id, workoutId))) return;
  await db.workoutExercise.deleteMany({ where: { id, workoutId } });
}

export async function addSet(workoutId: string, workoutExerciseId: string) {
  const user = await requireUser();
  if (!(await ownedActiveWorkout(user.id, workoutId))) return null;
  const we = await db.workoutExercise.findFirst({
    where: { id: workoutExerciseId, workoutId },
    include: { sets: { orderBy: { order: "desc" }, take: 1 } },
  });
  if (!we) return null;
  const last = we.sets[0];
  const s = await db.setEntry.create({
    data: {
      workoutExerciseId: we.id,
      order: (last?.order ?? -1) + 1,
      type: "working",
      weightKg: last?.weightKg ?? 0,
      reps: last?.reps ?? 0,
      durationSec: last?.durationSec ?? 0,
      distanceKm: last?.distanceKm ?? 0,
    },
  });
  return {
    id: s.id,
    done: false,
    type: "working" as const,
    weightKg: s.weightKg,
    reps: s.reps,
    durationSec: s.durationSec,
    distanceKm: s.distanceKm,
  };
}

const setSchema = z.object({
  type: z.enum(["working", "warmup", "failure"]),
  weightKg: z.number().min(0).max(2000),
  reps: z.number().int().min(0).max(1000),
  durationSec: z.number().int().min(0).max(86400),
  distanceKm: z.number().min(0).max(1000),
  done: z.boolean(),
});

export async function updateSet(
  workoutId: string,
  setId: string,
  input: unknown,
): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const parsed = setSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  if (!(await ownedActiveWorkout(user.id, workoutId))) return { ok: false };
  const existing = await db.setEntry.findFirst({
    where: { id: setId, workoutExercise: { workoutId } },
  });
  if (!existing) return { ok: false };
  await db.setEntry.update({
    where: { id: setId },
    data: {
      ...parsed.data,
      completedAt: parsed.data.done ? (existing.completedAt ?? new Date()) : null,
    },
  });
  return { ok: true };
}

export async function deleteSet(workoutId: string, setId: string) {
  const user = await requireUser();
  if (!(await ownedActiveWorkout(user.id, workoutId))) return;
  await db.setEntry.deleteMany({ where: { id: setId, workoutExercise: { workoutId } } });
}

export async function updateWorkoutNote(workoutId: string, note: string) {
  const user = await requireUser();
  if (!(await ownedActiveWorkout(user.id, workoutId))) return;
  await db.workout.update({
    where: { id: workoutId },
    data: { note: note.trim().slice(0, 1000) || null },
  });
}

export async function cancelWorkout(workoutId: string) {
  const user = await requireUser();
  await db.workout.deleteMany({ where: { id: workoutId, userId: user.id, status: "active" } });
  revalidatePath("/workout/active");
  redirect("/workout/active");
}

export async function finishWorkout(
  workoutId: string,
  feeling: number | null,
): Promise<{ error: string } | undefined> {
  const user = await requireUser();
  const workout = await db.workout.findFirst({
    where: { id: workoutId, userId: user.id, status: "active" },
    include: { exercises: { include: { sets: true } } },
  });
  if (!workout) return { error: "not_found" };

  const doneSets = workout.exercises.flatMap((e) => e.sets).filter((s) => s.done);
  if (doneSets.length === 0) return { error: "nothing_done" };

  const totalVolume = workoutVolume(doneSets);
  await db.$transaction(async (tx) => {
    // Невыполненные подходы и пустые упражнения в историю не попадают.
    await tx.setEntry.deleteMany({
      where: { workoutExercise: { workoutId }, done: false },
    });
    await tx.workoutExercise.deleteMany({ where: { workoutId, sets: { none: {} } } });
    await tx.workout.update({
      where: { id: workoutId },
      data: {
        status: "finished",
        finishedAt: new Date(),
        totalVolume,
        feeling: feeling && feeling >= 1 && feeling <= 5 ? feeling : null,
      },
    });
  });
  await syncAchievements(user.id, user.weeklyGoal, workoutId);
  revalidatePath("/workouts");
  redirect(`/workouts/${workoutId}?done=1`);
}
