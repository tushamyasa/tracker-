export interface AchievementStats {
  workouts: number;
  longestStreak: number;
  recordSets: number;
  totalVolumeKg: number;
  longestWorkoutMin: number;
  /** Максимум различных групп мышц (без кардио и «всё тело») за одну неделю. */
  maxMusclesInWeek: number;
  customExercises: number;
  weeksGoalMet: number;
  measurements: number;
  level: number;
}

export interface AchievementDef {
  code: string;
  /** Иконка из lucide-react. */
  icon: string;
  test: (s: AchievementStats) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { code: "first_workout", icon: "Flag", test: (s) => s.workouts >= 1 },
  { code: "workouts_10", icon: "Dumbbell", test: (s) => s.workouts >= 10 },
  { code: "workouts_50", icon: "Dumbbell", test: (s) => s.workouts >= 50 },
  { code: "workouts_100", icon: "Medal", test: (s) => s.workouts >= 100 },
  { code: "streak_3", icon: "Flame", test: (s) => s.longestStreak >= 3 },
  { code: "streak_7", icon: "Flame", test: (s) => s.longestStreak >= 7 },
  { code: "streak_30", icon: "Flame", test: (s) => s.longestStreak >= 30 },
  { code: "first_record", icon: "Trophy", test: (s) => s.recordSets >= 1 },
  { code: "records_10", icon: "Trophy", test: (s) => s.recordSets >= 10 },
  { code: "volume_10t", icon: "Weight", test: (s) => s.totalVolumeKg >= 10_000 },
  { code: "volume_100t", icon: "Weight", test: (s) => s.totalVolumeKg >= 100_000 },
  { code: "long_workout", icon: "Timer", test: (s) => s.longestWorkoutMin >= 60 },
  { code: "muscles_7_week", icon: "Activity", test: (s) => s.maxMusclesInWeek >= 7 },
  { code: "custom_exercise", icon: "PencilLine", test: (s) => s.customExercises >= 1 },
  { code: "weekly_goal", icon: "Target", test: (s) => s.weeksGoalMet >= 1 },
  { code: "first_measurement", icon: "Ruler", test: (s) => s.measurements >= 1 },
  { code: "level_5", icon: "Star", test: (s) => s.level >= 5 },
  { code: "level_10", icon: "Crown", test: (s) => s.level >= 10 },
];

/** Коды достижений, условия которых выполнены при данной статистике. */
export function satisfiedAchievements(stats: AchievementStats): string[] {
  return ACHIEVEMENTS.filter((a) => a.test(stats)).map((a) => a.code);
}
