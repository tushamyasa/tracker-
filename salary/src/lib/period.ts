import { addMonths, monthRange, previousMonthRange, yearRange, type DateRange } from "./dates";

export type Period = {
  kind: "month" | "year";
  year: number;
  /** 1–12 для месяца; 0 для года */
  month: number;
  range: DateRange;
  prevRange: DateRange;
  label: string;
  /** Подпись для сравнения: «к прошлому месяцу» / «к прошлому году» */
  compareLabel: string;
  /** Query-параметры для этого периода, предыдущего и следующего */
  query: string;
  prevQuery: string;
  nextQuery: string;
  /** Есть ли следующий период (не позже текущего) */
  hasNext: boolean;
};

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;
const YEAR_RE = /^\d{4}$/;
const MIN_YEAR = 1970;
const MAX_YEAR = 2999;

const monthName = (year: number, month: number) => {
  const s = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)))
    .replace(/\s?г\.$/, "");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const pad = (n: number) => String(n).padStart(2, "0");
const monthQuery = (y: number, m: number) => `month=${y}-${pad(m)}`;

/**
 * Разбирает ?month=YYYY-MM или ?year=YYYY. Некорректное значение или его
 * отсутствие → текущий месяц.
 */
export function parsePeriod(
  params: { month?: string; year?: string },
  today: Date = new Date(),
): Period {
  const curYear = today.getFullYear();
  const curMonth = today.getMonth() + 1;

  const yearMatch = params.year && YEAR_RE.test(params.year) ? Number(params.year) : null;
  if (yearMatch !== null && yearMatch >= MIN_YEAR && yearMatch <= MAX_YEAR) {
    const y = yearMatch;
    return {
      kind: "year",
      year: y,
      month: 0,
      range: yearRange(y),
      prevRange: yearRange(y - 1),
      label: `${y} год`,
      compareLabel: "к прошлому году",
      query: `year=${y}`,
      prevQuery: `year=${y - 1}`,
      nextQuery: `year=${y + 1}`,
      hasNext: y < curYear,
    };
  }

  const m = params.month ? MONTH_RE.exec(params.month) : null;
  const year = m ? Number(m[1]) : curYear;
  const month = m ? Number(m[2]) : curMonth;
  const safe = year >= MIN_YEAR && year <= MAX_YEAR ? { year, month } : { year: curYear, month: curMonth };

  const prev = addMonths(safe.year, safe.month, -1);
  const next = addMonths(safe.year, safe.month, 1);
  return {
    kind: "month",
    year: safe.year,
    month: safe.month,
    range: monthRange(safe.year, safe.month),
    prevRange: previousMonthRange(safe.year, safe.month),
    label: monthName(safe.year, safe.month),
    compareLabel: "к прошлому месяцу",
    query: monthQuery(safe.year, safe.month),
    prevQuery: monthQuery(prev.year, prev.month),
    nextQuery: monthQuery(next.year, next.month),
    hasNext: safe.year * 12 + safe.month < curYear * 12 + curMonth,
  };
}

/** Изменение в процентах; null, если база равна нулю. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
