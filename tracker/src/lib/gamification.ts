export const XP_PER_SET = 10;
export const XP_PER_WORKOUT = 50;
export const XP_PER_RECORD = 100;

const DAY = 86_400_000;

/** Суммарный XP, нужный для достижения уровня n: 100·n·(n+1)/2 (100, 300, 600, …). */
export function xpThreshold(n: number): number {
  return 50 * n * (n + 1);
}

export interface XpInput {
  workouts: number;
  doneSets: number;
  /** Число подходов, побивших хотя бы один рекорд. */
  recordSets: number;
}

export function totalXp({ workouts, doneSets, recordSets }: XpInput): number {
  return workouts * XP_PER_WORKOUT + doneSets * XP_PER_SET + recordSets * XP_PER_RECORD;
}

export interface LevelInfo {
  level: number;
  xp: number;
  /** XP, с которого начался текущий уровень. */
  levelStart: number;
  /** XP, нужный для следующего уровня. */
  nextAt: number;
  /** Доля прохождения текущего уровня, 0–1. */
  progress: number;
}

/** Новичок начинает с уровня 1; уровень n+1 открывается при xpThreshold(n). */
export function levelInfo(xp: number): LevelInfo {
  let reached = 0;
  while (xpThreshold(reached + 1) <= xp) reached += 1;
  const levelStart = xpThreshold(reached);
  const nextAt = xpThreshold(reached + 1);
  return {
    level: reached + 1,
    xp,
    levelStart,
    nextAt,
    progress: (xp - levelStart) / (nextAt - levelStart),
  };
}

const utcDay = (d: Date) => Math.floor(d.getTime() / DAY);

/** Максимум дней между двумя тренировками, при котором серия не рвётся (два дня отдыха). */
export const MAX_STREAK_GAP_DAYS = 3;

export interface StreakInfo {
  /** Текущая серия в днях с тренировками; 0, если она прервалась. */
  current: number;
  longest: number;
}

/**
 * Серия считается по дням с тренировками: между соседними днями может быть
 * не больше двух дней отдыха. Даты — по UTC.
 */
export function streakInfo(starts: Date[], now: Date = new Date()): StreakInfo {
  const days = [...new Set(starts.map(utcDay))].sort((a, b) => a - b);
  if (days.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = days[i] - days[i - 1] <= MAX_STREAK_GAP_DAYS ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  const alive = utcDay(now) - days[days.length - 1] <= MAX_STREAK_GAP_DAYS;
  return { current: alive ? run : 0, longest };
}

/** Начало недели (понедельник, 00:00 UTC). */
export function weekStart(d: Date): Date {
  const day = utcDay(d);
  const weekday = (new Date(day * DAY).getUTCDay() + 6) % 7;
  return new Date((day - weekday) * DAY);
}

export function weeklyProgress(starts: Date[], goal: number, now: Date = new Date()) {
  const from = weekStart(now).getTime();
  const count = starts.filter(
    (d) => d.getTime() >= from && d.getTime() <= now.getTime() + DAY,
  ).length;
  return { count, goal, done: count >= goal, ratio: Math.min(1, count / Math.max(1, goal)) };
}

/** Сколько недель истории выполнена недельная цель. */
export function weeksGoalMet(starts: Date[], goal: number): number {
  const perWeek = new Map<number, number>();
  for (const d of starts) {
    const k = weekStart(d).getTime();
    perWeek.set(k, (perWeek.get(k) ?? 0) + 1);
  }
  return [...perWeek.values()].filter((n) => n >= goal).length;
}
