import { describe, expect, it } from "vitest";
import { displayToKg, formatDuration, kgToDisplay } from "@/lib/units";
import { fieldsForKind, workoutVolume } from "@/lib/workout-types";

describe("units", () => {
  it("кг остаются кг", () => {
    expect(kgToDisplay(62.5, "kg")).toBe(62.5);
    expect(displayToKg(62.5, "kg")).toBe(62.5);
  });
  it("переводит кг в фунты и обратно без накопления ошибки", () => {
    expect(kgToDisplay(100, "lb")).toBe(220.5);
    const kg = displayToKg(225, "lb");
    expect(kgToDisplay(kg, "lb")).toBe(225);
  });
});

describe("formatDuration", () => {
  it("форматирует минуты и часы", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(3725)).toBe("1:02:05");
    expect(formatDuration(-5)).toBe("0:00");
  });
});

describe("workoutVolume", () => {
  it("считает только выполненные и неразминочные подходы", () => {
    expect(
      workoutVolume([
        { type: "working", weightKg: 100, reps: 5, done: true },
        { type: "working", weightKg: 100, reps: 5, done: false },
        { type: "warmup", weightKg: 40, reps: 10, done: true },
        { type: "failure", weightKg: 80, reps: 8, done: true },
      ]),
    ).toBe(1140);
  });
});

describe("fieldsForKind", () => {
  it("определяет поля по типу упражнения", () => {
    expect(fieldsForKind("weight_reps")).toMatchObject({ weight: true, reps: true });
    expect(fieldsForKind("reps")).toMatchObject({ weight: false, reps: true });
    expect(fieldsForKind("time")).toMatchObject({ duration: true, reps: false });
    expect(fieldsForKind("distance_time")).toMatchObject({ distance: true, duration: true });
  });
});
