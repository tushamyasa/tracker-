import { cmToDisplay, kgToDisplay, unitLabel, lengthLabel, type Units } from "./units";

export const BODY_METRICS = ["weight", "bodyFat", "chest", "waist", "hips", "arm"] as const;
export type BodyMetric = (typeof BODY_METRICS)[number];

export interface MeasurementLike {
  id: string;
  date: Date;
  weightKg: number | null;
  bodyFatPct: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  armCm: number | null;
  note: string | null;
}

/** Значение показателя в базовых единицах (кг, %, см) или null, если не измерялось. */
export function rawValue(m: MeasurementLike, metric: BodyMetric): number | null {
  switch (metric) {
    case "weight":
      return m.weightKg;
    case "bodyFat":
      return m.bodyFatPct;
    case "chest":
      return m.chestCm;
    case "waist":
      return m.waistCm;
    case "hips":
      return m.hipsCm;
    case "arm":
      return m.armCm;
  }
}

/** Значение в единицах пользователя: кг/фунты, см/дюймы, проценты как есть. */
export function displayValue(metric: BodyMetric, raw: number, units: Units): number {
  if (metric === "weight") return kgToDisplay(raw, units);
  if (metric === "bodyFat") return Math.round(raw * 10) / 10;
  return cmToDisplay(raw, units);
}

export function bodyUnit(metric: BodyMetric, units: Units): string {
  if (metric === "weight") return unitLabel(units);
  if (metric === "bodyFat") return "%";
  return lengthLabel(units);
}

export interface BodyPoint {
  at: number;
  value: number;
}

/** Серия для графика: точки только там, где показатель измерялся, по возрастанию даты. */
export function buildBodySeries(
  list: MeasurementLike[],
  metric: BodyMetric,
  units: Units,
  since: Date | null = null,
): BodyPoint[] {
  return list
    .filter((m) => !since || m.date >= since)
    .flatMap((m) => {
      const raw = rawValue(m, metric);
      return raw === null
        ? []
        : [{ at: m.date.getTime(), value: displayValue(metric, raw, units) }];
    })
    .sort((a, b) => a.at - b.at);
}

export interface Latest {
  value: number;
  /** Изменение относительно предыдущего замера этого показателя; null — замер единственный. */
  delta: number | null;
  at: number;
}

export function latestWithDelta(
  list: MeasurementLike[],
  metric: BodyMetric,
  units: Units,
): Latest | null {
  const points = buildBodySeries(list, metric, units);
  if (points.length === 0) return null;
  const last = points[points.length - 1];
  const prev = points.length > 1 ? points[points.length - 2] : null;
  return {
    value: last.value,
    delta: prev ? Math.round((last.value - prev.value) * 10) / 10 : null,
    at: last.at,
  };
}

/** Допустимые диапазоны в базовых единицах для проверки ввода. */
export const BODY_LIMITS: Record<BodyMetric, [number, number]> = {
  weight: [20, 500],
  bodyFat: [2, 70],
  chest: [30, 250],
  waist: [30, 250],
  hips: [30, 250],
  arm: [10, 100],
};

/** Разбирает дату формы YYYY-MM-DD в UTC-полночь; null для некорректной. */
export function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value ? null : d;
}
