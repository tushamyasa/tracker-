import { metricsOf, scanHistory, type RecordType, type SetSample } from "./records";

export interface ChartPoint {
  workoutId: string;
  /** Начало тренировки, мс. */
  at: number;
  value: number;
  isPR: boolean;
}

export interface SampleWithTime {
  sample: SetSample;
  startedAt: Date;
}

/** Метрики, которые можно показать на графике, для типа упражнения. */
export function chartMetricsForKind(kind: string): RecordType[] {
  switch (kind) {
    case "reps":
      return ["reps"];
    case "time":
      return ["duration"];
    case "weight_time":
      return ["weight", "duration"];
    case "distance_time":
      return ["distance", "duration"];
    default:
      return ["weight", "e1rm", "volume", "reps"];
  }
}

/**
 * Серия для графика: по одной точке на тренировку.
 * weight/e1rm/reps/duration/distance — лучший подход тренировки, volume — сумма по упражнению.
 * isPR отмечает тренировки, где метрика стала рекордной (для volume не размечается:
 * там рекорд считается по одному подходу, а график показывает сумму).
 */
export function buildSeries(
  history: SampleWithTime[],
  kind: string,
  metric: RecordType,
  since: Date | null = null,
): ChartPoint[] {
  const { events } = scanHistory(
    history.map((h) => h.sample),
    kind,
  );
  const prWorkouts = new Set(
    events.filter((e) => e.types.includes(metric)).map((e) => e.set.workoutId),
  );

  const byWorkout = new Map<string, { at: number; value: number }>();
  for (const { sample, startedAt } of history) {
    if (sample.type === "warmup") continue;
    const m = metricsOf(sample, kind);
    const v = metric === "volume" ? sample.weightKg * sample.reps : (m[metric] ?? 0);
    const cur = byWorkout.get(sample.workoutId) ?? { at: startedAt.getTime(), value: 0 };
    cur.value = metric === "volume" ? cur.value + v : Math.max(cur.value, v);
    byWorkout.set(sample.workoutId, cur);
  }

  return [...byWorkout.entries()]
    .map(([workoutId, { at, value }]) => ({
      workoutId,
      at,
      value,
      isPR: metric !== "volume" && prWorkouts.has(workoutId),
    }))
    .filter((p) => p.value > 0 && (!since || p.at >= since.getTime()))
    .sort((a, b) => a.at - b.at);
}

export const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export interface HeatCell {
  key: string;
  count: number;
}

/**
 * Сетка теплокарты: недели (с понедельника) × 7 дней за последние 12 месяцев.
 * Дни после сегодняшнего — null. Даты считаются по UTC.
 */
export function buildHeatmap(starts: Date[], now: Date = new Date()): (HeatCell | null)[][] {
  const counts = new Map<string, number>();
  for (const d of starts) counts.set(dayKey(d), (counts.get(dayKey(d)) ?? 0) + 1);

  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const first = new Date(today.getTime() - 364 * 86_400_000);
  const weekday = (first.getUTCDay() + 6) % 7; // 0 = понедельник
  const gridStart = new Date(first.getTime() - weekday * 86_400_000);

  const weeks: (HeatCell | null)[][] = [];
  for (let cursor = gridStart.getTime(); cursor <= today.getTime(); cursor += 7 * 86_400_000) {
    const week: (HeatCell | null)[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(cursor + i * 86_400_000);
      if (day.getTime() > today.getTime() || day.getTime() < first.getTime()) {
        week.push(null);
      } else {
        const key = dayKey(day);
        week.push({ key, count: counts.get(key) ?? 0 });
      }
    }
    weeks.push(week);
  }
  return weeks;
}

/** Уровень насыщенности ячейки теплокарты 0–3. */
export function heatLevel(count: number): 0 | 1 | 2 | 3 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  return 3;
}

/** Число выполненных рабочих подходов по группам мышц. */
export function setsByMuscle(
  items: { muscleGroup: string; sample: SetSample }[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const { muscleGroup, sample } of items) {
    if (sample.type === "warmup") continue;
    out[muscleGroup] = (out[muscleGroup] ?? 0) + 1;
  }
  return out;
}
