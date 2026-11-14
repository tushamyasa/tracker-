import type { TransactionType } from "@/db/schema";
import type { CategoryColor } from "./palette";
import type { CategoryIcon } from "./icons";

export type DefaultCategory = {
  name: string;
  type: TransactionType;
  icon: CategoryIcon;
  color: CategoryColor;
};

/** Набор, создаваемый при регистрации (PRD FR-C3). */
export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  { name: "Продукты", type: "expense", icon: "shopping-cart", color: "#84CC16" },
  { name: "Транспорт", type: "expense", icon: "bus", color: "#0EA5E9" },
  { name: "Жильё", type: "expense", icon: "home", color: "#6366F1" },
  { name: "Коммуналка", type: "expense", icon: "zap", color: "#EAB308" },
  { name: "Здоровье", type: "expense", icon: "heart-pulse", color: "#F43F5E" },
  { name: "Кафе и рестораны", type: "expense", icon: "utensils", color: "#F97316" },
  { name: "Развлечения", type: "expense", icon: "film", color: "#D946EF" },
  { name: "Одежда", type: "expense", icon: "shirt", color: "#8B5CF6" },
  { name: "Связь", type: "expense", icon: "smartphone", color: "#14B8A6" },
  { name: "Подписки", type: "expense", icon: "repeat", color: "#A16207" },
  { name: "Прочее", type: "expense", icon: "circle-ellipsis", color: "#64748B" },

  { name: "Зарплата", type: "income", icon: "banknote", color: "#059669" },
  { name: "Аванс", type: "income", icon: "wallet", color: "#14B8A6" },
  { name: "Подработка", type: "income", icon: "briefcase", color: "#0EA5E9" },
  { name: "Премия", type: "income", icon: "award", color: "#EAB308" },
  { name: "Подарки", type: "income", icon: "gift", color: "#D946EF" },
  { name: "Прочее", type: "income", icon: "circle-ellipsis", color: "#64748B" },
];
