/** Перемещает элемент на одну позицию вверх (-1) или вниз (1). Возвращает новый массив. */
export function moveItem<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const target = index + dir;
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export interface Starter {
  key: string;
  nameRu: string;
  nameEn: string;
  /** [slug упражнения, подходы, повторы] */
  items: [string, number, number][];
}

export const STARTERS: Starter[] = [
  {
    key: "full-body",
    nameRu: "Всё тело",
    nameEn: "Full Body",
    items: [
      ["squat", 3, 8],
      ["bench-press", 3, 8],
      ["barbell-row", 3, 8],
      ["overhead-press", 3, 10],
      ["plank", 3, 1],
    ],
  },
  {
    key: "push",
    nameRu: "Push (жимовой день)",
    nameEn: "Push day",
    items: [
      ["bench-press", 4, 8],
      ["incline-db-press", 3, 10],
      ["overhead-press", 3, 8],
      ["lateral-raise", 3, 15],
      ["triceps-pushdown", 3, 12],
    ],
  },
  {
    key: "pull",
    nameRu: "Pull (тяговый день)",
    nameEn: "Pull day",
    items: [
      ["deadlift", 3, 5],
      ["pull-up", 3, 8],
      ["barbell-row", 3, 8],
      ["face-pull", 3, 15],
      ["barbell-curl", 3, 10],
    ],
  },
  {
    key: "legs",
    nameRu: "Legs (день ног)",
    nameEn: "Legs day",
    items: [
      ["squat", 4, 8],
      ["romanian-deadlift", 3, 10],
      ["leg-press", 3, 12],
      ["seated-leg-curl", 3, 12],
      ["standing-calf-raise", 4, 15],
    ],
  },
  {
    key: "upper",
    nameRu: "Верх тела",
    nameEn: "Upper body",
    items: [
      ["bench-press", 4, 8],
      ["barbell-row", 4, 8],
      ["overhead-press", 3, 10],
      ["lat-pulldown", 3, 10],
      ["db-curl", 3, 12],
    ],
  },
  {
    key: "lower",
    nameRu: "Низ тела",
    nameEn: "Lower body",
    items: [
      ["squat", 4, 8],
      ["romanian-deadlift", 3, 10],
      ["leg-press", 3, 12],
      ["hip-thrust", 3, 10],
      ["standing-calf-raise", 4, 15],
    ],
  },
];
