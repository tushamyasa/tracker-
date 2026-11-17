import "server-only";
import { db } from "@/lib/db";
import { satisfiedAchievements, type AchievementStats } from "@/lib/achievements";
import {
  levelInfo,
  streakInfo,
  totalXp,
  weekStart,
  weeklyProgress,
  weeksGoalMet,
  XP_PER_RECORD,
  XP_PER_SET,
  XP_PER_WORKOUT,
} from "@/lib/gamification";
import { groupByExercise, loadHistorySamples } from "@/lib/progress-data";
import { scanHistory } from "@/lib/records";

const NON_TRACKED_GROUPS = new Set(["cardio", "fullbody"]);

/**
 * Вся игровая статистика считается из истории тренировок, а не хранится счётчиками:
 * правка и удаление тренировок автоматически пересчитывают XP, уровень и серию.
 * Исключение — открытые достижения: однажды полученное остаётся.
 */
export async function loadGamification(userId: string, weeklyGoal: number) {
  const [workouts, samples, customExercises, measurements] = await Promise.all([
    db.workout.findMany({
      where: { userId, status: "finished" },
      select: {
        id: true,
        startedAt: true,
        finishedAt: true,
        totalVolume: true,
        exercises: { select: { exercise: { select: { muscleGroup: true } } } },
      },
    }),
    loadHistorySamples(userId),
    db.exercise.count({ where: { ownerId: userId } }),
    db.bodyMeasurement.count({ where: { userId } }),
  ]);

  // Подходы-рекорды по каждому упражнению и по тренировкам.
  const recordSetIds = new Set<string>();
  const recordsByWorkout = new Map<string, number>();
  for (const list of groupByExercise(samples).values()) {
    const { events } = scanHistory(
      list.map((h) => h.sample),
      list[0].kind,
    );
    for (const e of events) {
      recordSetIds.add(e.set.id);
      recordsByWorkout.set(e.set.workoutId, (recordsByWorkout.get(e.set.workoutId) ?? 0) + 1);
    }
  }

  const doneSetsByWorkout = new Map<string, number>();
  for (const h of samples) {
    doneSetsByWorkout.set(h.sample.workoutId, (doneSetsByWorkout.get(h.sample.workoutId) ?? 0) + 1);
  }

  const starts = workouts.map((w) => w.startedAt);
  const xp = totalXp({
    workouts: workouts.length,
    doneSets: samples.length,
    recordSets: recordSetIds.size,
  });
  const level = levelInfo(xp);
  const streak = streakInfo(starts);
  const week = weeklyProgress(starts, weeklyGoal);

  const musclesPerWeek = new Map<number, Set<string>>();
  for (const w of workouts) {
    const key = weekStart(w.startedAt).getTime();
    const set = musclesPerWeek.get(key) ?? new Set<string>();
    for (const e of w.exercises) {
      if (!NON_TRACKED_GROUPS.has(e.exercise.muscleGroup)) set.add(e.exercise.muscleGroup);
    }
    musclesPerWeek.set(key, set);
  }

  const stats: AchievementStats = {
    workouts: workouts.length,
    longestStreak: streak.longest,
    recordSets: recordSetIds.size,
    totalVolumeKg: workouts.reduce((n, w) => n + w.totalVolume, 0),
    longestWorkoutMin: Math.max(
      0,
      ...workouts.map((w) =>
        w.finishedAt ? (w.finishedAt.getTime() - w.startedAt.getTime()) / 60_000 : 0,
      ),
    ),
    maxMusclesInWeek: Math.max(0, ...[...musclesPerWeek.values()].map((s) => s.size)),
    customExercises,
    weeksGoalMet: weeksGoalMet(starts, weeklyGoal),
    measurements,
    level: level.level,
  };

  /** XP, который принесла конкретная тренировка. */
  const workoutXp = (workoutId: string) =>
    XP_PER_WORKOUT +
    (doneSetsByWorkout.get(workoutId) ?? 0) * XP_PER_SET +
    (recordsByWorkout.get(workoutId) ?? 0) * XP_PER_RECORD;

  return { xp, level, streak, week, stats, workoutXp };
}

/**
 * Открывает достижения, условия которых выполнены, и возвращает только что открытые.
 * Идемпотентна: повторный вызов ничего не добавит.
 */
export async function syncAchievements(
  userId: string,
  weeklyGoal: number,
  workoutId: string | null = null,
): Promise<string[]> {
  const { stats } = await loadGamification(userId, weeklyGoal);
  const satisfied = satisfiedAchievements(stats);
  const existing = new Set(
    (await db.userAchievement.findMany({ where: { userId }, select: { code: true } })).map(
      (a) => a.code,
    ),
  );
  const fresh = satisfied.filter((c) => !existing.has(c));
  for (const code of fresh) {
    await db.userAchievement.upsert({
      where: { userId_code: { userId, code } },
      update: {},
      create: { userId, code, workoutId },
    });
  }
  return fresh;
}
