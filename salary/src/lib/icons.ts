/**
 * Ключи иконок категорий. В БД хранится ключ; компонент-иконка подбирается
 * на клиенте по этому ключу (lucide-react) на этапе 4.
 */
export const CATEGORY_ICONS = [
  "shopping-cart",
  "car",
  "bus",
  "home",
  "zap",
  "heart-pulse",
  "utensils",
  "coffee",
  "film",
  "gamepad-2",
  "shirt",
  "smartphone",
  "repeat",
  "gift",
  "graduation-cap",
  "plane",
  "paw-print",
  "baby",
  "dumbbell",
  "wrench",
  "book-open",
  "scissors",
  "fuel",
  "wallet",
  "banknote",
  "briefcase",
  "trending-up",
  "award",
  "piggy-bank",
  "hand-coins",
  "receipt",
  "landmark",
  "percent",
  "laptop",
  "music",
  "umbrella",
  "tag",
  "circle-ellipsis",
] as const;

export type CategoryIcon = (typeof CATEGORY_ICONS)[number];

export function isCategoryIcon(value: string): value is CategoryIcon {
  return (CATEGORY_ICONS as readonly string[]).includes(value);
}
