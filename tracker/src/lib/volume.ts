export type SetType = "working" | "warmup" | "failure";

export interface SetLike {
  weightKg: number;
  reps: number;
  type: string;
}

/** Объём = сумма вес × повторы по рабочим подходам и подходам до отказа. */
export function totalVolume(sets: SetLike[]): number {
  return sets.filter((s) => s.type !== "warmup").reduce((sum, s) => sum + s.weightKg * s.reps, 0);
}

/** Расчётный 1RM по Эпли; для 1 повтора равен весу. */
export function estimate1RM(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg;
  return weightKg * (1 + reps / 30);
}
