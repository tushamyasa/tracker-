import { describe, expect, it } from "vitest";
import {
  mergeBests,
  metricsOf,
  newRecords,
  recordTypesForKind,
  scanHistory,
  type SetSample,
} from "@/lib/records";

let n = 0;
const set = (over: Partial<SetSample> = {}): SetSample => ({
  id: `s${n++}`,
  workoutId: "w1",
  at: n,
  type: "working",
  weightKg: 100,
  reps: 5,
  durationSec: 0,
  distanceKm: 0,
  ...over,
});

describe("metricsOf", () => {
  it("считает вес, повторы, объём и 1RM по Эпли", () => {
    const m = metricsOf(set({ weightKg: 100, reps: 3 }), "weight_reps");
    expect(m.weight).toBe(100);
    expect(m.reps).toBe(3);
    expect(m.volume).toBe(300);
    expect(m.e1rm).toBeCloseTo(110);
  });
  it("не даёт рекордов за разминочные подходы", () => {
    expect(metricsOf(set({ type: "warmup" }), "weight_reps")).toEqual({});
  });
  it("1RM считается только для 1–12 повторов", () => {
    expect(metricsOf(set({ reps: 15 }), "weight_reps").e1rm).toBeUndefined();
    expect(metricsOf(set({ reps: 12 }), "weight_reps").e1rm).toBeDefined();
  });
  it("использует только релевантные метрики типа упражнения", () => {
    expect(Object.keys(metricsOf(set({ weightKg: 0, reps: 20 }), "reps"))).toEqual(["reps"]);
    expect(recordTypesForKind("time")).toEqual(["duration"]);
  });
});

describe("newRecords", () => {
  it("первая запись рекордом не считается", () => {
    expect(newRecords({}, set(), "weight_reps")).toEqual([]);
  });
  it("рекорд — только строго больше предыдущего максимума", () => {
    const prior = mergeBests({}, metricsOf(set({ weightKg: 100, reps: 5 }), "weight_reps"));
    expect(newRecords(prior, set({ weightKg: 100, reps: 5 }), "weight_reps")).toEqual([]);
    expect(newRecords(prior, set({ weightKg: 105, reps: 5 }), "weight_reps")).toContain("weight");
  });
  it("может побить только часть рекордов", () => {
    const prior = mergeBests({}, metricsOf(set({ weightKg: 100, reps: 5 }), "weight_reps"));
    const types = newRecords(prior, set({ weightKg: 80, reps: 10 }), "weight_reps");
    expect(types).toContain("reps");
    expect(types).not.toContain("weight");
  });
});

describe("scanHistory", () => {
  it("находит рекорды в хронологическом порядке независимо от порядка входа", () => {
    const a = set({ at: 1, weightKg: 100, reps: 5 });
    const b = set({ at: 2, weightKg: 100, reps: 5 }); // без изменений
    const c = set({ at: 3, weightKg: 110, reps: 5 }); // рекорд
    const { bests, events } = scanHistory([c, a, b], "weight_reps");
    expect(events.map((e) => e.set.id)).toEqual([c.id]);
    expect(events[0].types).toContain("weight");
    expect(bests.weight).toBe(110);
  });
  it("после удаления рекордного подхода пересчёт возвращает прежний максимум", () => {
    const a = set({ at: 1, weightKg: 100 });
    const c = set({ at: 3, weightKg: 110 });
    expect(scanHistory([a, c], "weight_reps").bests.weight).toBe(110);
    expect(scanHistory([a], "weight_reps").bests.weight).toBe(100);
  });
  it("рекорд внутри одной тренировки учитывает предыдущие подходы", () => {
    const a = set({ at: 1, weightKg: 100 });
    const b = set({ at: 2, weightKg: 102.5 });
    const c = set({ at: 3, weightKg: 105 });
    expect(scanHistory([a, b, c], "weight_reps").events.map((e) => e.set.id)).toEqual([b.id, c.id]);
  });
});
