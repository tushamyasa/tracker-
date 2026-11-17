export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "abs",
  "glutes",
  "quads",
  "hamstrings",
  "calves",
  "fullbody",
  "cardio",
] as const;

export const EQUIPMENT = [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "bodyweight",
  "kettlebell",
  "band",
  "other",
] as const;

export const KINDS = ["weight_reps", "reps", "time", "weight_time", "distance_time"] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
export type Equipment = (typeof EQUIPMENT)[number];
export type ExerciseKind = (typeof KINDS)[number];

export interface ExerciseLike {
  id: string;
  nameRu: string;
  nameEn: string;
  muscleGroup: string;
  equipment: string;
}

export interface ExerciseFilter {
  q?: string;
  muscle?: string;
  equipment?: string;
  favoritesOnly?: boolean;
}

export function exerciseName(e: Pick<ExerciseLike, "nameRu" | "nameEn">, locale: string): string {
  return locale === "en" ? e.nameEn : e.nameRu;
}

/**
 * Фильтрация в JS: SQLite не умеет регистронезависимый поиск по кириллице.
 * Ищет по обоим названиям (ru и en), независимо от текущего языка.
 */
export function filterExercises<T extends ExerciseLike>(
  list: T[],
  filter: ExerciseFilter,
  favoriteIds: Set<string> = new Set(),
): T[] {
  const q = filter.q?.trim().toLowerCase();
  return list.filter((e) => {
    if (filter.muscle && e.muscleGroup !== filter.muscle) return false;
    if (filter.equipment && e.equipment !== filter.equipment) return false;
    if (filter.favoritesOnly && !favoriteIds.has(e.id)) return false;
    if (q && !e.nameRu.toLowerCase().includes(q) && !e.nameEn.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });
}
