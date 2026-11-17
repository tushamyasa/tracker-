export type CsvCell = string | number | boolean | null | undefined;

/**
 * Значение ячейки CSV. Защищает от CSV-инъекций: ячейки, начинающиеся с = + - @
 * (а также с таб/перевода строки), Excel может воспринять как формулу, поэтому
 * перед ними ставится апостроф. Числа не трогаем: отрицательные значения безопасны.
 */
export function csvCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** CSV с BOM, чтобы Excel корректно открывал кириллицу; строки разделены CRLF. */
export function toCsv(header: string[], rows: CsvCell[][]): string {
  const lines = [header, ...rows].map((r) => r.map(csvCell).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n";
}

export function exportFileName(kind: string, ext: "csv" | "json", now: Date = new Date()): string {
  return `workout-tracker-${kind}-${now.toISOString().slice(0, 10)}.${ext}`;
}
