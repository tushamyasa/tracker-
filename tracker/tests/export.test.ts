import { describe, expect, it } from "vitest";
import { csvCell, exportFileName, toCsv } from "@/lib/export";

describe("csvCell", () => {
  it("оставляет простые значения как есть", () => {
    expect(csvCell("Жим")).toBe("Жим");
    expect(csvCell(12.5)).toBe("12.5");
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });
  it("экранирует кавычки, запятые и переводы строк", () => {
    expect(csvCell('a "b"')).toBe('"a ""b"""');
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell("a\nb")).toBe('"a\nb"');
  });
  it("нейтрализует формулы (CSV-инъекция)", () => {
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("-1")).toBe("'-1");
    expect(csvCell("@cmd")).toBe("'@cmd");
    expect(csvCell('=HYPERLINK("x","y")')).toBe('"\'=HYPERLINK(""x"",""y"")"');
  });
  it("отрицательные числа не портит", () => {
    expect(csvCell(-3)).toBe("-3");
  });
});

describe("toCsv", () => {
  it("добавляет BOM, заголовок и строки через CRLF", () => {
    const csv = toCsv(
      ["a", "b"],
      [
        [1, "x"],
        [2, "y,z"],
      ],
    );
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv.slice(1)).toBe('a,b\r\n1,x\r\n2,"y,z"\r\n');
  });
});

describe("exportFileName", () => {
  it("содержит тип и дату", () => {
    expect(exportFileName("sets", "csv", new Date("2026-03-05T10:00:00Z"))).toBe(
      "workout-tracker-sets-2026-03-05.csv",
    );
  });
});
