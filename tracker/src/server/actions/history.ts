"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { syncAchievements } from "@/lib/gamification-data";
import { workoutVolume } from "@/lib/workout-types";
import { requireUser } from "@/server/auth/session";
import type { FormState } from "./auth";

const setSchema = z.object({
  type: z.enum(["working", "warmup", "failure"]),
  weightKg: z.number().min(0).max(2000),
  reps: z.number().int().min(0).max(1000),
  durationSec: z.number().int().min(0).max(86400),
  distanceKm: z.number().min(0).max(1000),
});

const payloadSchema = z.object({
  name: z.string().trim().min(1).max(80),
  startedAt: z.iso.datetime(),
  durationMin: z.number().int().min(1).max(1440),
  note: z
    .string()
    .trim()
    .max(1000)
    .transform((v) => v || null),
  feeling: z.number().int().min(1).max(5).nullable(),
  exercises: z
    .array(
      z.object({
        exerciseId: z.string().min(1),
        sets: z.array(setSchema).min(1).max(50),
      }),
    )
    .min(1)
    .max(40),
});

/** Создаёт завершённую тренировку задним числом (id = null) или правит существующую. */
export async function saveWorkoutEdit(
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

  const startedAt = new Date(data.startedAt);
  if (startedAt.getTime() > Date.now() + 60_000) return { error: "future_date" };

  if (id) {
    const existing = await db.workout.findFirst({
      where: { id, userId: user.id, status: "finished" },
    });
    if (!existing) return { error: "not_found" };
  }

  const ids = [...new Set(data.exercises.map((e) => e.exerciseId))];
  const accessible = await db.exercise.count({
    where: { id: { in: ids }, OR: [{ ownerId: null }, { ownerId: user.id }] },
  });
  if (accessible !== ids.length) return { error: "not_found" };

  const allSets = data.exercises.flatMap((e) => e.sets.map((s) => ({ ...s, done: true })));
  const fields = {
    name: data.name,
    startedAt,
    finishedAt: new Date(startedAt.getTime() + data.durationMin * 60_000),
    note: data.note,
    feeling: data.feeling,
    totalVolume: workoutVolume(allSets),
    status: "finished",
  };
  const exercises = data.exercises.map((e, order) => ({
    exerciseId: e.exerciseId,
    order,
    sets: {
      create: e.sets.map((s, i) => ({
        ...s,
        order: i,
        done: true,
        completedAt: startedAt,
      })),
    },
  }));

  const workoutId = await db.$transaction(async (tx) => {
    if (id) {
      await tx.workoutExercise.deleteMany({ where: { workoutId: id } });
      await tx.workout.update({
        where: { id },
        data: { ...fields, exercises: { create: exercises } },
      });
      return id;
    }
    const created = await tx.workout.create({
      data: { ...fields, userId: user.id, exercises: { create: exercises } },
    });
    return created.id;
  });

  await syncAchievements(user.id, user.weeklyGoal, workoutId);
  revalidatePath("/workouts");
  redirect(`/workouts/${workoutId}`);
}

export async function deleteWorkout(id: string) {
  const user = await requireUser();
  await db.workout.deleteMany({ where: { id, userId: user.id, status: "finished" } });
  revalidatePath("/workouts");
  redirect("/workouts");
}

/** Начинает новую активную тренировку с теми же упражнениями и значениями подходов. */
export async function repeatWorkout(id: string) {
  const user = await requireUser();
  const active = await db.workout.findFirst({ where: { userId: user.id, status: "active" } });
  if (active) redirect("/workout/active");

  const src = await db.workout.findFirst({
    where: { id, userId: user.id, status: "finished" },
    include: {
      exercises: { orderBy: { order: "asc" }, include: { sets: { orderBy: { order: "asc" } } } },
    },
  });
  if (!src) redirect("/workouts");

  try {
    await db.workout.create({
      data: {
        userId: user.id,
        name: src.name,
        templateId: src.templateId,
        exercises: {
          create: src.exercises.map((e, order) => ({
            exerciseId: e.exerciseId,
            order,
            sets: {
              create: e.sets.map((s, i) => ({
                order: i,
                type: s.type,
                weightKg: s.weightKg,
                reps: s.reps,
                durationSec: s.durationSec,
                distanceKm: s.distanceKm,
              })),
            },
          })),
        },
      },
    });
  } catch {
    // Параллельный старт: уникальный индекс не даст создать вторую активную.
  }
  redirect("/workout/active");
}
