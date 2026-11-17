import { describe, expect, it } from "vitest";
import {
  buildHeatmap,
  buildSeries,
  chartMetricsForKind,
  heatLevel,
  setsByMuscle,
} from "@/lib/progress";
import type { SetSample } from "@/lib/records";

let n = 0;
const sample = (workoutId: string, at: number, over: Partial<SetSample> = {}): SetSample => ({
  id: `s${n++}`,
  workoutId,
  at,
  type: "working",
  weightKg: 100,
  reps: 5,
  durationSec: 0,
  distanceKm: 0,
  ...over,
});

const day = (d: number) => new Date(Date.UTC(2026, 0, d));

describe("buildSeries", () => {
  const history = [
    { sample: sample("a", 1, { weightKg: 100 }), startedAt: day(1) },
    { sample: sample("a", 2, { weightKg: 90 }), startedAt: day(1) },
    { sample: sample("b", 3, { weightKg: 110 }), startedAt: day(8) },
    { sample: sample("c", 4, { weightKg: 105 }), startedAt: day(15) },
  ];

  it("берёт лучший вес за тренировку и отмечает рекорды", () => {
    const s = buildSeries(history, "weight_reps", "weight");
    expect(s.map((p) => p.value)).toEqual([100, 110, 105]);
    expect(s.map((p) => p.isPR)).toEqual([false, true, false]);
  });
  it("объём — сумма по тренировке, без отметок рекордов", () => {
    const s = buildSeries(history, "weight_reps", "volume");
    expect(s[0].value).toBe(100 * 5 + 90 * 5);
    expect(s.every((p) => !p.isPR)).toBe(true);
  });
  it("игнорирует разминку и фильтрует по периоду", () => {
    const withWarmup = [
      ...history,
      { sample: sample("b", 3, { weightKg: 300, type: "warmup" }), startedAt: day(8) },
    ];
    expect(buildSeries(withWarmup, "weight_reps", "weight")[1].value).toBe(110);
    expect(buildSeries(history, "weight_reps", "weight", day(10)).map((p) => p.workoutId)).toEqual([
      "c",
    ]);
  });
});

describe("chartMetricsForKind", () => {
  it("отдаёт метрики по типу упражнения", () => {
    expect(chartMetricsForKind("weight_reps")).toContain("e1rm");
    expect(chartMetricsForKind("time")).toEqual(["duration"]);
  });
});

describe("buildHeatmap", () => {
  const now = new Date(Date.UTC(2026, 5, 15, 12)); // понедельник
  it("строит сетку недель по 7 дней, начиная с понедельника", () => {
    const weeks = buildHeatmap([], now);
    expect(weeks.length).toBeGreaterThanOrEqual(52);
    expect(weeks.length).toBeLessThanOrEqual(54);
    for (const w of weeks) expect(w).toHaveLength(7);
  });
  it("считает тренировки по дням и не показывает будущие дни", () => {
    const weeks = buildHeatmap(
      [new Date(Date.UTC(2026, 5, 15, 8)), new Date(Date.UTC(2026, 5, 15, 18))],
      now,
    );
    const last = weeks[weeks.length - 1];
    expect(last[0]).toEqual({ key: "2026-06-15", count: 2 });
    expect(last[1]).toBeNull();
  });
});

describe("heatLevel и setsByMuscle", () => {
  it("уровни насыщенности", () => {
    expect([0, 1, 2, 3, 9].map(heatLevel)).toEqual([0, 1, 2, 3, 3]);
  });
  it("считает подходы по группам, без разминки", () => {
    expect(
      setsByMuscle([
        { muscleGroup: "chest", sample: sample("a", 1) },
        { muscleGroup: "chest", sample: sample("a", 2, { type: "warmup" }) },
        { muscleGroup: "back", sample: sample("a", 3) },
      ]),
    ).toEqual({ chest: 1, back: 1 });
  });
});
