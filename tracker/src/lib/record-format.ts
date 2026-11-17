import { kgToDisplay, unitLabel, type Units } from "./units";
import type { RecordType } from "./records";

/** Значение рекорда с единицей измерения для показа пользователю. */
export function formatRecordValue(type: RecordType, value: number, units: Units): string {
  switch (type) {
    case "weight":
    case "e1rm":
    case "volume":
      return `${Math.round(kgToDisplay(value, units) * 10) / 10} ${unitLabel(units)}`;
    case "reps":
      return String(Math.round(value));
    case "duration":
      return `${Math.round(value)} s`;
    case "distance":
      return `${Math.round(value * 100) / 100} km`;
  }
}

/** Значение для оси графика в единицах пользователя (без подписи). */
export function chartValue(type: RecordType, value: number, units: Units): number {
  if (type === "weight" || type === "e1rm" || type === "volume") {
    return Math.round(kgToDisplay(value, units) * 10) / 10;
  }
  return Math.round(value * 100) / 100;
}

export function chartUnit(type: RecordType, units: Units): string {
  if (type === "weight" || type === "e1rm" || type === "volume") return unitLabel(units);
  if (type === "duration") return "s";
  if (type === "distance") return "km";
  return "";
}
