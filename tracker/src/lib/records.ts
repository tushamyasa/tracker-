import { estimate1RM } from "./volume";

export const RECORD_TYPES = ["weight", "e1rm", "volume", "reps", "duration", "distance"] as const;
export type RecordType = (typeof RECORD_TYPES)[number];
export type Bests = Partial<Record<RecordType, number>>;

/** Подход, достаточный для расчёта рекордов. */
export interface SetSample {
  /** Стабильный идентификатор подхода. */
  id: string;
  workoutId: string;
  /** Момент подхода: определяет хронологию (дата тренировки + порядок). */
  at: number;
  type: string;
  weightKg: number;
  reps: number;
  durationSec: number;
  distanceKm: number;
}

/** Какие рекорды существуют для типа упражнения. */
export function recordTypesForKind(kind: string): RecordType[] {
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

const EPS = 1e-9;

/** Значения рекордных метрик одного подхода. Разминочные подходы рекордов не дают. */
export function metricsOf(set: SetSample, kind: string): Bests {
  if (set.type === "warmup") return {};
  const out: Bests = {};
  for (const t of recordTypesForKind(kind)) {
    let v = 0;
    switch (t) {
      case "weight":
        v = set.weightKg;
        break;
      case "reps":
        v = set.reps;
        break;
      case "volume":
        v = set.weightKg * set.reps;
        break;
      case "e1rm":
        v =
          set.weightKg > 0 && set.reps >= 1 && set.reps <= 12
            ? estimate1RM(set.weightKg, set.reps)
            : 0;
        break;
      case "duration":
        v = set.durationSec;
        break;
      case "distance":
        v = set.distanceKm;
        break;
    }
    if (v > 0) out[t] = v;
  }
  return out;
}

export function mergeBests(a: Bests, b: Bests): Bests {
  const out: Bests = { ...a };
  for (const t of RECORD_TYPES) {
    const v = b[t];
    if (v !== undefined && v > (out[t] ?? 0)) out[t] = v;
  }
  return out;
}

/**
 * Какие рекорды побил подход относительно предыдущих максимумов.
 * Если предыдущих данных нет вообще, первая запись рекордом не считается.
 */
export function newRecords(prior: Bests, set: SetSample, kind: string): RecordType[] {
  if (Object.keys(prior).length === 0) return [];
  const m = metricsOf(set, kind);
  return RECORD_TYPES.filter((t) => m[t] !== undefined && m[t]! > (prior[t] ?? 0) + EPS);
}

export interface RecordEvent {
  set: SetSample;
  types: RecordType[];
}

/** Проходит историю подходов упражнения в хронологическом порядке. */
export function scanHistory(
  samples: SetSample[],
  kind: string,
): { bests: Bests; events: RecordEvent[] } {
  const sorted = [...samples].sort((a, b) => a.at - b.at);
  let bests: Bests = {};
  const events: RecordEvent[] = [];
  for (const s of sorted) {
    const types = newRecords(bests, s, kind);
    if (types.length > 0) events.push({ set: s, types });
    bests = mergeBests(bests, metricsOf(s, kind));
  }
  return { bests, events };
}
