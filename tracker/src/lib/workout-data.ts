import "server-only";
import { db } from "@/lib/db";
import { exerciseName } from "@/lib/exercises";
import { exerciseBests } from "@/lib/progress-data";
import type { ActiveWorkoutDTO, SetType, SetValues, WorkoutExerciseDTO } from "@/lib/workout-types";

type Raw = {
  type: string;
  weightKg: number;
  reps: number;
  durationSec: number;
  distanceKm: number;
};

const toValues = (s: Raw): SetValues => ({
  type: s.type as SetType,
  weightKg: s.weightKg,
  reps: s.reps,
  durationSec: s.durationSec,
  distanceKm: s.distanceKm,
});

/** Подходы из последней завершённой тренировки пользователя по каждому упражнению. */
export async function previousSets(
  userId: string,
  exerciseIds: string[],
  excludeWorkoutId?: string,
): Promise<Map<string, SetValues[]>> {
  const result = new Map<string, SetValues[]>();
  await Promise.all(
    exerciseIds.map(async (exerciseId) => {
      const last = await db.workoutExercise.findFirst({
        where: {
          exerciseId,
          workout: {
            userId,
            status: "finished",
            ...(excludeWorkoutId ? { id: { not: excludeWorkoutId } } : {}),
          },
        },
        orderBy: { workout: { startedAt: "desc" } },
        include: { sets: { where: { done: true }, orderBy: { order: "asc" } } },
      });
      if (last && last.sets.length > 0) result.set(exerciseId, last.sets.map(toValues));
    }),
  );
  return result;
}

export async function toExerciseDTO(
  userId: string,
  workoutId: string,
  weId: string,
  locale: string,
): Promise<WorkoutExerciseDTO | null> {
  const we = await db.workoutExercise.findFirst({
    where: { id: weId, workout: { id: workoutId, userId } },
    include: { exercise: true, sets: { orderBy: { order: "asc" } } },
  });
  if (!we) return null;
  const prev = await previousSets(userId, [we.exerciseId], workoutId);
  const bests = await exerciseBests(userId, [we.exerciseId]);
  return {
    id: we.id,
    exerciseId: we.exerciseId,
    name: exerciseName(we.exercise, locale),
    kind: we.exercise.kind,
    muscleGroup: we.exercise.muscleGroup,
    note: we.note,
    sets: we.sets.map((s) => ({ id: s.id, done: s.done, ...toValues(s) })),
    prev: prev.get(we.exerciseId) ?? [],
    bests: bests.get(we.exerciseId) ?? null,
  };
}

export async function getActiveWorkout(
  userId: string,
  locale: string,
): Promise<ActiveWorkoutDTO | null> {
  const w = await db.workout.findFirst({
    where: { userId, status: "active" },
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: { exercise: true, sets: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!w) return null;
  const prev = await previousSets(
    userId,
    w.exercises.map((e) => e.exerciseId),
    w.id,
  );
  const bests = await exerciseBests(
    userId,
    w.exercises.map((e) => e.exerciseId),
  );
  return {
    id: w.id,
    name: w.name,
    startedAt: w.startedAt.toISOString(),
    note: w.note ?? "",
    exercises: w.exercises.map((we) => ({
      id: we.id,
      exerciseId: we.exerciseId,
      name: exerciseName(we.exercise, locale),
      kind: we.exercise.kind,
      muscleGroup: we.exercise.muscleGroup,
      note: we.note,
      sets: we.sets.map((s) => ({ id: s.id, done: s.done, ...toValues(s) })),
      prev: prev.get(we.exerciseId) ?? [],
      bests: bests.get(we.exerciseId) ?? null,
    })),
  };
}
