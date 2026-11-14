/** Палитра цветов категорий (design.md, раздел 3). */
export const CATEGORY_COLORS = [
  "#059669",
  "#0EA5E9",
  "#6366F1",
  "#8B5CF6",
  "#D946EF",
  "#F43F5E",
  "#F97316",
  "#EAB308",
  "#84CC16",
  "#14B8A6",
  "#64748B",
  "#A16207",
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export function isCategoryColor(value: string): value is CategoryColor {
  return (CATEGORY_COLORS as readonly string[]).includes(value);
}
