import { describe, expect, it } from "vitest";
import { formatMoney, formatSigned, minorToInputString, parseAmountToMinor } from "./money";

describe("parseAmountToMinor", () => {
  it.each([
    ["100", 10000],
    ["1234.5", 123450],
    ["1234,56", 123456],
    ["1 234,56", 123456],
    ["1 234,56", 123456],
    ["0.01", 1],
    ["007", 700],
    ["0.10", 10],
    ["19.99", 1999],
    ["999999999.99", 99_999_999_999],
  ])("%s → %d", (input, expected) => {
    expect(parseAmountToMinor(input)).toBe(expected);
  });

  it.each(["", "abc", "0", "0.00", "-5", "1.234", "1,2,3", "1e5", "10000000000", ".5", "5."])(
    "отклоняет %j",
    (input) => {
      expect(parseAmountToMinor(input)).toBeNull();
    },
  );

  it("не страдает от погрешностей float", () => {
    expect(parseAmountToMinor("0.29")).toBe(29);
    expect(parseAmountToMinor("1.15")).toBe(115);
    expect(parseAmountToMinor("4.35")).toBe(435);
  });
});

describe("minorToInputString", () => {
  it("форматирует для поля ввода", () => {
    expect(minorToInputString(123456)).toBe("1234.56");
    expect(minorToInputString(123400)).toBe("1234");
    expect(minorToInputString(5)).toBe("0.05");
  });

  it("обратимо с parseAmountToMinor", () => {
    for (const minor of [1, 99, 100, 101, 123456, 99_999_999_999]) {
      expect(parseAmountToMinor(minorToInputString(minor))).toBe(minor);
    }
  });
});

describe("formatMoney", () => {
  const norm = (s: string) => s.replace(/[  ]/g, " ");

  it("форматирует рубли", () => {
    expect(norm(formatMoney(123456))).toBe("1 234,56 ₽");
  });

  it("добавляет знак", () => {
    expect(norm(formatSigned(10000, "income"))).toBe("+ 100,00 ₽");
    expect(norm(formatSigned(10000, "expense"))).toBe("− 100,00 ₽");
  });
});
