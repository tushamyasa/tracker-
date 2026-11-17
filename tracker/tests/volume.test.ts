import { describe, expect, it } from "vitest";
import { estimate1RM, totalVolume } from "@/lib/volume";

describe("totalVolume", () => {
  it("не учитывает разминочные подходы", () => {
    expect(
      totalVolume([
        { weightKg: 20, reps: 10, type: "warmup" },
        { weightKg: 100, reps: 5, type: "working" },
        { weightKg: 90, reps: 8, type: "failure" },
      ]),
    ).toBe(1220);
  });
});

describe("estimate1RM", () => {
  it("равен весу при одном повторе", () => expect(estimate1RM(100, 1)).toBe(100));
  it("считает по Эпли", () => expect(estimate1RM(100, 3)).toBeCloseTo(110));
});
