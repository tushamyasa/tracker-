import { describe, expect, it } from "vitest";
import {
  bodyUnit,
  buildBodySeries,
  latestWithDelta,
  parseDateOnly,
  type MeasurementLike,
} from "@/lib/body";
import { cmToDisplay, displayToCm } from "@/lib/units";

let n = 0;
const m = (day: number, over: Partial<MeasurementLike> = {}): MeasurementLike => ({
  id: `m${n++}`,
  date: new Date(Date.UTC(2026, 0, day)),
  weightKg: null,
  bodyFatPct: null,
  chestCm: null,
  waistCm: null,
  hipsCm: null,
  armCm: null,
  note: null,
  ...over,
});

describe("единицы длины", () => {
  it("см остаются см, для пользователей с фунтами — дюймы", () => {
    expect(cmToDisplay(100, "kg")).toBe(100);
    expect(cmToDisplay(100, "lb")).toBe(39.4);
    expect(displayToCm(40, "lb")).toBe(101.6);
    expect(cmToDisplay(displayToCm(32, "lb"), "lb")).toBe(32);
  });
  it("подписи единиц", () => {
    expect(bodyUnit("weight", "kg")).toBe("kg");
    expect(bodyUnit("weight", "lb")).toBe("lb");
    expect(bodyUnit("bodyFat", "kg")).toBe("%");
    expect(bodyUnit("waist", "kg")).toBe("cm");
    expect(bodyUnit("waist", "lb")).toBe("in");
  });
});

describe("buildBodySeries", () => {
  const list = [
    m(10, { weightKg: 80, waistCm: 90 }),
    m(3, { weightKg: 82 }),
    m(20, { waistCm: 88 }),
  ];
  it("берёт только замеры показателя и сортирует по дате", () => {
    expect(buildBodySeries(list, "weight", "kg").map((p) => p.value)).toEqual([82, 80]);
    expect(buildBodySeries(list, "waist", "kg").map((p) => p.value)).toEqual([90, 88]);
    expect(buildBodySeries(list, "hips", "kg")).toEqual([]);
  });
  it("переводит в фунты и фильтрует по периоду", () => {
    expect(buildBodySeries(list, "weight", "lb")[0].value).toBe(180.8);
    expect(buildBodySeries(list, "weight", "kg", new Date(Date.UTC(2026, 0, 5)))).toHaveLength(1);
  });
});

describe("latestWithDelta", () => {
  it("считает изменение к предыдущему замеру этого показателя", () => {
    const list = [m(1, { weightKg: 82 }), m(5, { waistCm: 90 }), m(9, { weightKg: 80.5 })];
    const w = latestWithDelta(list, "weight", "kg");
    expect(w).toMatchObject({ value: 80.5, delta: -1.5 });
    expect(latestWithDelta(list, "waist", "kg")).toMatchObject({ value: 90, delta: null });
    expect(latestWithDelta(list, "arm", "kg")).toBeNull();
  });
});

describe("parseDateOnly", () => {
  it("принимает корректные даты и отвергает остальные", () => {
    expect(parseDateOnly("2026-02-28")?.toISOString()).toBe("2026-02-28T00:00:00.000Z");
    expect(parseDateOnly("2026-02-30")).toBeNull();
    expect(parseDateOnly("28.02.2026")).toBeNull();
    expect(parseDateOnly("")).toBeNull();
  });
});
