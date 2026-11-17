import {
  Activity,
  Crown,
  Dumbbell,
  Flag,
  Flame,
  Medal,
  PencilLine,
  Ruler,
  Star,
  Target,
  Timer,
  Trophy,
  Weight,
  type LucideIcon,
} from "lucide-react";
import { ACHIEVEMENTS } from "@/lib/achievements";

const ICONS: Record<string, LucideIcon> = {
  Activity,
  Crown,
  Dumbbell,
  Flag,
  Flame,
  Medal,
  PencilLine,
  Ruler,
  Star,
  Target,
  Timer,
  Trophy,
  Weight,
};

export function AchievementIcon({ code, className }: { code: string; className?: string }) {
  const def = ACHIEVEMENTS.find((a) => a.code === code);
  const Icon = (def && ICONS[def.icon]) ?? Trophy;
  return <Icon className={className} aria-hidden />;
}
