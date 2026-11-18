import {
  Briefcase, Laptop, Gift, Landmark, ShoppingCart, Bus, Home, Utensils, HeartPulse, Gamepad2,
  Ellipsis, Wallet, Car, Plane, Coffee, Shirt, GraduationCap, Dumbbell, Smartphone, Wifi,
  Zap, PawPrint, Baby, Music, Film, BookOpen, Wrench, Banknote, PiggyBank, TrendingUp,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  wallet: Wallet,
  briefcase: Briefcase,
  laptop: Laptop,
  gift: Gift,
  landmark: Landmark,
  banknote: Banknote,
  "piggy-bank": PiggyBank,
  "trending-up": TrendingUp,
  "shopping-cart": ShoppingCart,
  bus: Bus,
  car: Car,
  plane: Plane,
  home: Home,
  utensils: Utensils,
  coffee: Coffee,
  "heart-pulse": HeartPulse,
  "gamepad-2": Gamepad2,
  film: Film,
  music: Music,
  shirt: Shirt,
  "graduation-cap": GraduationCap,
  "book-open": BookOpen,
  dumbbell: Dumbbell,
  smartphone: Smartphone,
  wifi: Wifi,
  zap: Zap,
  "paw-print": PawPrint,
  baby: Baby,
  wrench: Wrench,
  ellipsis: Ellipsis,
};

export const ICON_NAMES = Object.keys(CATEGORY_ICONS);

export const CATEGORY_COLORS = [
  "#10B981", "#14B8A6", "#0EA5E9", "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7", "#EC4899",
  "#EF4444", "#F97316", "#F59E0B", "#84CC16", "#64748B", "#78716C",
];

export function getCategoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[name] ?? Wallet;
}
