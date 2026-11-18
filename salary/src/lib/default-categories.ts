export const DEFAULT_CATEGORIES = [
  { name: "Зарплата", type: "income", color: "#10B981", icon: "briefcase" },
  { name: "Подработка", type: "income", color: "#14B8A6", icon: "laptop" },
  { name: "Подарки", type: "income", color: "#8B5CF6", icon: "gift" },
  { name: "Проценты", type: "income", color: "#0EA5E9", icon: "landmark" },
  { name: "Продукты", type: "expense", color: "#F97316", icon: "shopping-cart" },
  { name: "Транспорт", type: "expense", color: "#3B82F6", icon: "bus" },
  { name: "Жильё", type: "expense", color: "#EF4444", icon: "home" },
  { name: "Кафе и рестораны", type: "expense", color: "#F59E0B", icon: "utensils" },
  { name: "Здоровье", type: "expense", color: "#EC4899", icon: "heart-pulse" },
  { name: "Развлечения", type: "expense", color: "#A855F7", icon: "gamepad-2" },
  { name: "Другое", type: "expense", color: "#64748B", icon: "ellipsis" },
] as const;
