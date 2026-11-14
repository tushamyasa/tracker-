/**
 * Деньги хранятся целыми числами в минорных единицах (копейках).
 * Float нигде не используется для расчётов.
 */

/** Максимум: 999 999 999,99 (в копейках). */
export const MAX_AMOUNT_MINOR = 99_999_999_999;

/**
 * Разбирает ввод пользователя ("1 234,56", "1234.5", "100") в копейки.
 * Возвращает null для некорректного ввода, нуля, отрицательных значений,
 * более двух знаков после запятой и значений выше максимума.
 */
export function parseAmountToMinor(input: string): number | null {
  const normalized = input.replace(/[\s  ]/g, "").replace(",", ".");
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) return null;

  const whole = match[1].replace(/^0+(?=\d)/, "");
  if (whole.length > 10) return null;

  const fraction = (match[2] ?? "").padEnd(2, "0");
  const minor = Number(whole) * 100 + Number(fraction);

  if (!Number.isSafeInteger(minor) || minor <= 0 || minor > MAX_AMOUNT_MINOR) return null;
  return minor;
}

/** Копейки → строка для поля ввода: 123456 → "1234.56", 123400 → "1234". */
export function minorToInputString(minor: number): string {
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  const whole = Math.trunc(abs / 100);
  const fraction = abs % 100;
  return fraction === 0
    ? `${sign}${whole}`
    : `${sign}${whole}.${String(fraction).padStart(2, "0")}`;
}

/** Форматирование с валютой: 123456 → "1 234,56 ₽" (ru-RU, RUB). */
export function formatMoney(minor: number, currency = "RUB", locale = "ru-RU"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

/** С явным знаком для доходов/расходов: "+ 1 234,56 ₽" / "− 1 234,56 ₽". */
export function formatSigned(
  minor: number,
  type: "income" | "expense",
  currency = "RUB",
  locale = "ru-RU",
): string {
  const sign = type === "income" ? "+" : "−";
  return `${sign} ${formatMoney(Math.abs(minor), currency, locale)}`;
}
