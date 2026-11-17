import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, satisfiedAchievements, type AchievementStats } from "@/lib/achievements";
import {
  levelInfo,
  streakInfo,
  totalXp,
  weekStart,
  weeklyProgress,
  weeksGoalMet,
  xpThreshold,
} from "@/lib/gamification";

const d = (y: number, m: number, day: number, h = 12) => new Date(Date.UTC(y, m - 1, day, h));

describe("XP и уровни", () => {
  it("начисляет XP за подходы, тренировки и рекорды", () => {
    expect(totalXp({ workouts: 2, doneSets: 10, recordSets: 1 })).toBe(100 + 100 + 100);
  });
  it("пороги уровней: 100, 300, 600", () => {
    expect([1, 2, 3].map(xpThreshold)).toEqual([100, 300, 600]);
  });
  it("новичок на уровне 1, следующий уровень со 100 XP", () => {
    expect(levelInfo(0)).toMatchObject({ level: 1, levelStart: 0, nextAt: 100, progress: 0 });
    expect(levelInfo(99).level).toBe(1);
    expect(levelInfo(100).level).toBe(2);
    expect(levelInfo(299).level).toBe(2);
    expect(levelInfo(300).level).toBe(3);
    expect(levelInfo(200).progress).toBeCloseTo(0.5);
  });
});

describe("streakInfo", () => {
  const now = d(2026, 6, 10);
  it("нет тренировок — нет серии", () => {
    expect(streakInfo([], now)).toEqual({ current: 0, longest: 0 });
  });
  it("допускает до двух дней отдыха между тренировками", () => {
    const starts = [d(2026, 6, 4), d(2026, 6, 7), d(2026, 6, 10)]; // каждые 3 дня
    expect(streakInfo(starts, now)).toEqual({ current: 3, longest: 3 });
  });
  it("три дня отдыха подряд рвут серию", () => {
    const starts = [d(2026, 6, 1), d(2026, 6, 5), d(2026, 6, 8)];
    expect(streakInfo(starts, d(2026, 6, 8))).toEqual({ current: 2, longest: 2 });
  });
  it("серия сгорает, если последняя тренировка давно", () => {
    const starts = [d(2026, 6, 1), d(2026, 6, 2), d(2026, 6, 3)];
    expect(streakInfo(starts, now)).toEqual({ current: 0, longest: 3 });
  });
  it("несколько тренировок в один день считаются одним днём", () => {
    expect(streakInfo([d(2026, 6, 10, 8), d(2026, 6, 10, 18)], now).current).toBe(1);
  });
});

describe("недельная цель", () => {
  it("неделя начинается с понедельника", () => {
    expect(weekStart(d(2026, 6, 14)).toISOString()).toBe("2026-06-08T00:00:00.000Z"); // воскресенье
    expect(weekStart(d(2026, 6, 8)).toISOString()).toBe("2026-06-08T00:00:00.000Z");
  });
  it("считает тренировки текущей недели", () => {
    const now = d(2026, 6, 11); // четверг
    const starts = [d(2026, 6, 1), d(2026, 6, 8), d(2026, 6, 10)];
    expect(weeklyProgress(starts, 3, now)).toMatchObject({ count: 2, goal: 3, done: false });
    expect(weeklyProgress(starts, 2, now).done).toBe(true);
  });
  it("считает недели с выполненной целью", () => {
    const starts = [d(2026, 6, 1), d(2026, 6, 2), d(2026, 6, 8)];
    expect(weeksGoalMet(starts, 2)).toBe(1);
    expect(weeksGoalMet(starts, 1)).toBe(2);
  });
});

describe("достижения", () => {
  const base: AchievementStats = {
    workouts: 0,
    longestStreak: 0,
    recordSets: 0,
    totalVolumeKg: 0,
    longestWorkoutMin: 0,
    maxMusclesInWeek: 0,
    customExercises: 0,
    weeksGoalMet: 0,
    measurements: 0,
    level: 1,
  };
  it("их не меньше пятнадцати и коды уникальны", () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(15);
    expect(new Set(ACHIEVEMENTS.map((a) => a.code)).size).toBe(ACHIEVEMENTS.length);
  });
  it("без активности ничего не открыто", () => {
    expect(satisfiedAchievements(base)).toEqual([]);
  });
  it("открывает по порогам", () => {
    const codes = satisfiedAchievements({
      ...base,
      workouts: 10,
      longestStreak: 7,
      recordSets: 1,
      totalVolumeKg: 10_000,
    });
    expect(codes).toEqual(
      expect.arrayContaining([
        "first_workout",
        "workouts_10",
        "streak_3",
        "streak_7",
        "first_record",
        "volume_10t",
      ]),
    );
    expect(codes).not.toContain("workouts_50");
    expect(codes).not.toContain("streak_30");
  });
});
