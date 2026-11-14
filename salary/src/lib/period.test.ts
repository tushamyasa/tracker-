import { describe, expect, it } from "vitest";
import { parsePeriod, percentChange } from "./period";

const today = new Date(2026, 10, 14); // 14 ноября 2026

describe("parsePeriod", () => {
  it("по умолчанию — текущий месяц", () => {
    const p = parsePeriod({}, today);
    expect(p.kind).toBe("month");
    expect(p.range).toEqual({ from: "2026-11-01", to: "2026-11-30" });
    expect(p.prevRange).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(p.label).toBe("Ноябрь 2026");
    expect(p.hasNext).toBe(false);
  });

  it("разбирает month=YYYY-MM и считает соседние периоды", () => {
    const p = parsePeriod({ month: "2026-01" }, today);
    expect(p.range.from).toBe("2026-01-01");
    expect(p.prevRange).toEqual({ from: "2025-12-01", to: "2025-12-31" });
    expect(p.prevQuery).toBe("month=2025-12");
    expect(p.nextQuery).toBe("month=2026-02");
    expect(p.hasNext).toBe(true);
  });

  it("разбирает year=YYYY", () => {
    const p = parsePeriod({ year: "2025" }, today);
    expect(p.kind).toBe("year");
    expect(p.range).toEqual({ from: "2025-01-01", to: "2025-12-31" });
    expect(p.prevRange).toEqual({ from: "2024-01-01", to: "2024-12-31" });
    expect(p.label).toBe("2025 год");
    expect(p.hasNext).toBe(true);
    expect(parsePeriod({ year: "2026" }, today).hasNext).toBe(false);
  });

  it.each([{ month: "2026-13" }, { month: "garbage" }, { year: "20x6" }, { year: "1500" }, { month: "0000-01" }])(
    "некорректный ввод %j → текущий месяц",
    (params) => {
      expect(parsePeriod(params, today).range.from).toBe("2026-11-01");
    },
  );
});

describe("percentChange", () => {
  it("считает проценты и обрабатывает нулевую базу", () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(50, 100)).toBe(-50);
    expect(percentChange(100, 100)).toBe(0);
    expect(percentChange(100, 0)).toBeNull();
  });
});
