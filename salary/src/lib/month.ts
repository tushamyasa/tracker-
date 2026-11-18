/**
 * Границы месяцев в часовом поясе пользователя.
 * tz — значение Date.getTimezoneOffset() браузера (минуты, UTC − local; для МСК = −180).
 */
export function parseMonth(ym: string | undefined, tz: number, now = new Date()): { year: number; month: number } {
  const m = ym?.match(/^(\d{4})-(\d{2})$/);
  if (m && Number(m[2]) >= 1 && Number(m[2]) <= 12) return { year: Number(m[1]), month: Number(m[2]) - 1 };
  const local = new Date(now.getTime() - tz * 60_000);
  return { year: local.getUTCFullYear(), month: local.getUTCMonth() };
}

/** Начало месяца (мс Unix, UTC) для локального месяца пользователя. Месяц может выходить за 0..11. */
export function monthStart(year: number, month: number, tz: number): number {
  return Date.UTC(year, month, 1) + tz * 60_000;
}

export function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(Date.UTC(year, month + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}

export const toYm = (year: number, month: number) => `${year}-${String(month + 1).padStart(2, "0")}`;

const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

export const monthLabel = (year: number, month: number) => `${MONTHS[month]} ${year}`;
export const monthShort = (month: number) => MONTHS_SHORT[month];
