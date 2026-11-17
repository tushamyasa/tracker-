"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { BODY_LIMITS, parseDateOnly, type BodyMetric } from "@/lib/body";
import { syncAchievements } from "@/lib/gamification-data";
import { displayToCm, displayToKg, type Units } from "@/lib/units";
import { requireUser } from "@/server/auth/session";
import type { FormState } from "./auth";

/** Пустая строка — «не измерял»; запятая допустима как десятичный разделитель. */
function num(v: FormDataEntryValue | null): number | null | "bad" {
  const s = String(v ?? "")
    .trim()
    .replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : "bad";
}

const FIELDS: { field: string; metric: BodyMetric; column: string }[] = [
  { field: "weight", metric: "weight", column: "weightKg" },
  { field: "bodyFat", metric: "bodyFat", column: "bodyFatPct" },
  { field: "chest", metric: "chest", column: "chestCm" },
  { field: "waist", metric: "waist", column: "waistCm" },
  { field: "hips", metric: "hips", column: "hipsCm" },
  { field: "arm", metric: "arm", column: "armCm" },
];

/**
 * Сохраняет замер на дату. Одна запись на дату: повторный ввод на ту же дату
 * дополняет и обновляет только заполненные поля.
 */
export async function saveMeasurement(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const units = user.units as Units;

  const date = parseDateOnly(String(formData.get("date") ?? ""));
  if (!date) return { error: "invalid" };
  if (date.getTime() > Date.now() + 86_400_000) return { error: "future_measurement" };

  const values: Record<string, number> = {};
  for (const { field, metric, column } of FIELDS) {
    const raw = num(formData.get(field));
    if (raw === "bad") return { error: "invalid" };
    if (raw === null) continue;
    let base = raw;
    if (metric === "weight") base = displayToKg(raw, units);
    else if (metric !== "bodyFat") base = displayToCm(raw, units);
    const [min, max] = BODY_LIMITS[metric];
    if (base < min || base > max) return { error: "out_of_range" };
    values[column] = base;
  }
  if (Object.keys(values).length === 0) return { error: "measurement_empty" };

  const note = String(formData.get("note") ?? "")
    .trim()
    .slice(0, 200);

  await db.bodyMeasurement.upsert({
    where: { userId_date: { userId: user.id, date } },
    create: { userId: user.id, date, ...values, note: note || null },
    update: { ...values, ...(note ? { note } : {}) },
  });
  await syncAchievements(user.id, user.weeklyGoal);
  revalidatePath("/body");
  return undefined;
}

export async function deleteMeasurement(id: string) {
  const user = await requireUser();
  await db.bodyMeasurement.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/body");
}
