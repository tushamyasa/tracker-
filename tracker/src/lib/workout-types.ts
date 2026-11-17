import type { Bests } from "./records";
import { totalVolume } from "./volume";

export type SetType = "working" | "warmup" | "failure";

export interface SetValues {
  type: SetType;
  weightKg: number;
  reps: number;
  durationSec: number;
  distanceKm: number;
}

export interface SetDTO extends SetValues {
  id: string;
  done: boolean;
}

export interface WorkoutExerciseDTO {
  id: string;
  exerciseId: string;
  name: string;
  kind: string;
  muscleGroup: string;
  note: string | null;
  sets: SetDTO[];
  /** Подходы из предыдущей тренировки с этим упражнением (для подсказки). */
  prev: SetValues[];
  /** Лучшие результаты из завершённых тренировок; null — истории ещё нет. */
  bests: Bests | null;
}

export interface ActiveWorkoutDTO {
  id: string;
  name: string;
  startedAt: string;
  note: string;
  exercises: WorkoutExerciseDTO[];
}

/** Какие поля подхода нужны для типа упражнения. */
export function fieldsForKind(kind: string): {
  weight: boolean;
  reps: boolean;
  duration: boolean;
  distance: boolean;
} {
  switch (kind) {
    case "reps":
      return { weight: false, reps: true, duration: false, distance: false };
    case "time":
      return { weight: false, reps: false, duration: true, distance: false };
    case "weight_time":
      return { weight: true, reps: false, duration: true, distance: false };
    case "distance_time":
      return { weight: false, reps: false, duration: true, distance: true };
    default:
      return { weight: true, reps: true, duration: false, distance: false };
  }
}

export interface DoneSetLike {
  type: string;
  weightKg: number;
  reps: number;
  done: boolean;
}

/** Объём тренировки: вес × повторы по выполненным рабочим подходам и подходам до отказа. */
export function workoutVolume(sets: DoneSetLike[]): number {
  return totalVolume(sets.filter((s) => s.done));
}
