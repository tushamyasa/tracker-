import {
  Award,
  Baby,
  Banknote,
  BookOpen,
  Briefcase,
  Bus,
  Car,
  CircleEllipsis,
  Coffee,
  Dumbbell,
  Film,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HandCoins,
  HeartPulse,
  House,
  Landmark,
  Laptop,
  Music,
  PawPrint,
  Percent,
  PiggyBank,
  Plane,
  Receipt,
  Repeat,
  Scissors,
  Shirt,
  ShoppingCart,
  Smartphone,
  Tag,
  TrendingUp,
  Umbrella,
  Utensils,
  Wallet,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { CategoryIcon as IconKey } from "@/lib/icons";
import { cn } from "@/lib/utils";

/** Record по всем ключам: TypeScript не даст забыть иконку при добавлении ключа. */
export const ICON_MAP: Record<IconKey, LucideIcon> = {
  "shopping-cart": ShoppingCart,
  car: Car,
  bus: Bus,
  home: House,
  zap: Zap,
  "heart-pulse": HeartPulse,
  utensils: Utensils,
  coffee: Coffee,
  film: Film,
  "gamepad-2": Gamepad2,
  shirt: Shirt,
  smartphone: Smartphone,
  repeat: Repeat,
  gift: Gift,
  "graduation-cap": GraduationCap,
  plane: Plane,
  "paw-print": PawPrint,
  baby: Baby,
  dumbbell: Dumbbell,
  wrench: Wrench,
  "book-open": BookOpen,
  scissors: Scissors,
  fuel: Fuel,
  wallet: Wallet,
  banknote: Banknote,
  briefcase: Briefcase,
  "trending-up": TrendingUp,
  award: Award,
  "piggy-bank": PiggyBank,
  "hand-coins": HandCoins,
  receipt: Receipt,
  landmark: Landmark,
  percent: Percent,
  laptop: Laptop,
  music: Music,
  umbrella: Umbrella,
  tag: Tag,
  "circle-ellipsis": CircleEllipsis,
};

const ICONS_BY_KEY: Record<string, LucideIcon> = ICON_MAP;

/** Иконка по ключу из БД (неизвестный ключ → Tag). */
export function CategoryGlyph({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS_BY_KEY[name] ?? Tag;
  return <Icon className={className} />;
}

/** Бейдж категории: цветная подложка + иконка (design.md, раздел 8). */
export function CategoryBadge({
  icon,
  color,
  className,
}: {
  icon: string;
  color: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", className)}
      style={{ backgroundColor: `${color}26`, color }}
    >
      <CategoryGlyph name={icon} className="size-4" />
    </span>
  );
}
