import { describe, expect, it } from "vitest";
import {
  addMonths,
  daysInMonth,
  formatDateRu,
  isValidDateString,
  lastMonths,
  monthRange,
  previousMonthRange,
  todayString,
  yearRange,
} from "./dates";

describe("isValidDateString", () => {
  it("принимает корректные даты", () => {
    expect(isValidDateString("2026-11-14")).toBe(true);
    expect(isValidDateString("2024-02-29")).toBe(true);
  });

  it.each(["2026-02-29", "2026-13-01", "2026-00-10", "2026-01-00", "26-01-01", "2026-1-1", ""])(
    "отклоняет %j",
    (v) => expect(isValidDateString(v)).toBe(false),
  );
});

describe("периоды", () => {
  it("daysInMonth учитывает високосный год", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2026, 11)).toBe(30);
  });

  it("monthRange", () => {
    expect(monthRange(2026, 2)).toEqual({ from: "2026-02-01", to: "2026-02-28" });
  });

  it("previousMonthRange через границу года", () => {
    expect(previousMonthRange(2026, 1)).toEqual({ from: "2025-12-01", to: "2025-12-31" });
  });

  it("yearRange", () => {
    expect(yearRange(2026)).toEqual({ from: "2026-01-01", to: "2026-12-31" });
  });

  it("addMonths", () => {
    expect(addMonths(2026, 11, 3)).toEqual({ year: 2027, month: 2 });
    expect(addMonths(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(addMonths(2026, 6, -18)).toEqual({ year: 2024, month: 12 });
  });

  it("lastMonths возвращает 12 месяцев по возрастанию", () => {
    const list = lastMonths(2026, 3, 12);
    expect(list).toHaveLength(12);
    expect(list[0].key).toBe("2025-04");
    expect(list[11].key).toBe("2026-03");
  });
});

describe("форматирование", () => {
  it("todayString использует локальные компоненты", () => {
    expect(todayString(new Date(2026, 10, 14, 23, 59))).toBe("2026-11-14");
  });

  it("formatDateRu", () => {
    expect(formatDateRu("2026-11-14")).toBe("14.11.2026");
  });
});
