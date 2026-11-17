import "server-only";
import { db } from "@/lib/db";
import { scanHistory, type Bests, type SetSample } from "@/lib/records";

export interface HistorySample {
  exerciseId: string;
  kind: string;
  muscleGroup: string;
  startedAt: Date;
  sample: SetSample;
}

/**
 * Все выполненные подходы пользователя из завершённых тренировок.
 * Рекорды не хранятся отдельно, а считаются из этих данных: так они всегда
 * согласованы с историей после правок и удалений.
 */
export async function loadHistorySamples(
  userId: string,
  opts: { exerciseIds?: string[]; since?: Date | null } = {},
): Promise<HistorySample[]> {
  const rows = await db.setEntry.findMany({
    where: {
      done: true,
      workoutExercise: {
        ...(opts.exerciseIds ? { exerciseId: { in: opts.exerciseIds } } : {}),
        workout: {
          userId,
          status: "finished",
          ...(opts.since ? { startedAt: { gte: opts.since } } : {}),
        },
      },
    },
    select: {
      id: true,
      order: true,
      type: true,
      weightKg: true,
      reps: true,
      durationSec: true,
      distanceKm: true,
      workoutExercise: {
        select: {
          order: true,
          exerciseId: true,
          exercise: { select: { kind: true, muscleGroup: true } },
          workout: { select: { id: true, startedAt: true } },
        },
      },
    },
  });

  return rows.map((r) => {
    const we = r.workoutExercise;
    return {
      exerciseId: we.exerciseId,
      kind: we.exercise.kind,
      muscleGroup: we.exercise.muscleGroup,
      startedAt: we.workout.startedAt,
      sample: {
        id: r.id,
        workoutId: we.workout.id,
        // Хронология: время тренировки, затем порядок упражнения и подхода.
        at: we.workout.startedAt.getTime() + we.order * 1000 + r.order,
        type: r.type,
        weightKg: r.weightKg,
        reps: r.reps,
        durationSec: r.durationSec,
        distanceKm: r.distanceKm,
      },
    };
  });
}

export function groupByExercise(samples: HistorySample[]): Map<string, HistorySample[]> {
  const map = new Map<string, HistorySample[]>();
  for (const s of samples) {
    const list = map.get(s.exerciseId);
    if (list) list.push(s);
    else map.set(s.exerciseId, [s]);
  }
  return map;
}

/** Лучшие результаты по каждому упражнению; null, если истории ещё нет. */
export async function exerciseBests(
  userId: string,
  exerciseIds: string[],
): Promise<Map<string, Bests | null>> {
  const samples = await loadHistorySamples(userId, { exerciseIds });
  const grouped = groupByExercise(samples);
  const result = new Map<string, Bests | null>();
  for (const id of exerciseIds) {
    const list = grouped.get(id);
    result.set(
      id,
      list
        ? scanHistory(
            list.map((h) => h.sample),
            list[0].kind,
          ).bests
        : null,
    );
  }
  return result;
}
