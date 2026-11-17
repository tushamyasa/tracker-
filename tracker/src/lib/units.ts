export type Units = "kg" | "lb";

const LB_PER_KG = 2.2046226218;

const round = (n: number, digits = 2) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

/** Вес в базе всегда в кг; для показа переводим в единицы пользователя. */
export function kgToDisplay(kg: number, units: Units): number {
  return units === "lb" ? round(kg * LB_PER_KG, 1) : round(kg, 2);
}

export function displayToKg(value: number, units: Units): number {
  return units === "lb" ? round(value / LB_PER_KG, 3) : round(value, 3);
}

export function unitLabel(units: Units): string {
  return units === "lb" ? "lb" : "kg";
}

/** Форматирует секунды как M:SS или H:MM:SS. */
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

const CM_PER_INCH = 2.54;

/** Обхваты в базе хранятся в сантиметрах; пользователям с фунтами показываем дюймы. */
export function cmToDisplay(cm: number, units: Units): number {
  return units === "lb" ? round(cm / CM_PER_INCH, 1) : round(cm, 1);
}

export function displayToCm(value: number, units: Units): number {
  return units === "lb" ? round(value * CM_PER_INCH, 2) : round(value, 2);
}

export function lengthLabel(units: Units): string {
  return units === "lb" ? "in" : "cm";
}
