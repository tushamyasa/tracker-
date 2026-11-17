import { describe, expect, it } from "vitest";
import { isPeriod, periodStart, toLocalInput } from "@/lib/history";

describe("periodStart", () => {
  const now = new Date("2026-06-30T12:00:00Z");
  it("для «всё время» границы нет", () => {
    expect(periodStart("all", now)).toBeNull();
  });
  it("отсчитывает дни назад", () => {
    expect(periodStart("week", now)?.toISOString()).toBe("2026-06-23T12:00:00.000Z");
    expect(periodStart("month", now)?.toISOString()).toBe("2026-05-31T12:00:00.000Z");
    expect(periodStart("year", now)?.toISOString()).toBe("2025-06-30T12:00:00.000Z");
  });
});

describe("isPeriod", () => {
  it("отвечает только на известные значения", () => {
    expect(isPeriod("week")).toBe(true);
    expect(isPeriod("decade")).toBe(false);
    expect(isPeriod(undefined)).toBe(false);
  });
});

describe("toLocalInput", () => {
  it("форматирует локальное время для datetime-local", () => {
    expect(toLocalInput(new Date(2026, 0, 5, 7, 3))).toBe("2026-01-05T07:03");
  });
});
