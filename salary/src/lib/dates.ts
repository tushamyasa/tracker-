/**
 * Даты — строки YYYY-MM-DD без часовых поясов.
 * Все вычисления идут по календарным компонентам.
 */

export type DateRange = { from: string; to: string }; // включительно

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n: number, len = 2) => String(n).padStart(len, "0");

export function toDateString(year: number, month: number, day: number): string {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

export function isValidDateString(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mo < 1 || mo > 12 || d < 1) return false;
  return d <= daysInMonth(y, mo);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Сегодняшняя дата в локальном часовом поясе системы. */
export function todayString(now: Date = new Date()): string {
  return toDateString(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Период календарного месяца. month: 1–12. */
export function monthRange(year: number, month: number): DateRange {
  return {
    from: toDateString(year, month, 1),
    to: toDateString(year, month, daysInMonth(year, month)),
  };
}

/** Сдвиг (year, month) на delta месяцев. month: 1–12. */
export function addMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** Период предыдущего месяца относительно (year, month). */
export function previousMonthRange(year: number, month: number): DateRange {
  const p = addMonths(year, month, -1);
  return monthRange(p.year, p.month);
}

/** Период календарного года. */
export function yearRange(year: number): DateRange {
  return { from: toDateString(year, 1, 1), to: toDateString(year, 12, 31) };
}

/** Список из `count` последних месяцев, заканчивая (year, month), по возрастанию. */
export function lastMonths(
  year: number,
  month: number,
  count: number,
): { year: number; month: number; key: string }[] {
  return Array.from({ length: count }, (_, i) => {
    const m = addMonths(year, month, i - (count - 1));
    return { ...m, key: `${pad(m.year, 4)}-${pad(m.month)}` };
  });
}

/** "2026-11-14" → "14.11.2026". */
export function formatDateRu(value: string): string {
  const m = DATE_RE.exec(value);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : value;
}
