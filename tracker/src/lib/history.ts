export const PERIODS = ["all", "week", "month", "quarter", "year"] as const;
export type Period = (typeof PERIODS)[number];

const DAYS: Record<Exclude<Period, "all">, number> = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
};

export function isPeriod(v: string | undefined): v is Period {
  return !!v && (PERIODS as readonly string[]).includes(v);
}

/** Начало периода или null для «за всё время». */
export function periodStart(period: Period, now: Date = new Date()): Date | null {
  if (period === "all") return null;
  return new Date(now.getTime() - DAYS[period] * 86_400_000);
}

export const PAGE_SIZE = 20;

/** Значение для <input type="datetime-local"> в локальном часовом поясе. */
export function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
