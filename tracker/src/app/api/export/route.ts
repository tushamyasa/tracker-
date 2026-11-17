import { getLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { exerciseName } from "@/lib/exercises";
import { exportFileName, toCsv } from "@/lib/export";
import { getCurrentUser } from "@/server/auth/session";

const NO_STORE = { "Cache-Control": "private, no-store" };

/**
 * Экспорт данных текущего пользователя.
 * ?format=json — все данные; ?format=csv — подходы (по умолчанию) или ?data=measurements.
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "json";
  const data = url.searchParams.get("data") ?? "workouts";
  const locale = await getLocale();

  if (format === "csv" && data === "measurements") {
    const rows = await db.bodyMeasurement.findMany({
      where: { userId: user.id },
      orderBy: { date: "asc" },
    });
    const csv = toCsv(
      ["date", "weight_kg", "body_fat_pct", "chest_cm", "waist_cm", "hips_cm", "arm_cm", "note"],
      rows.map((m) => [
        m.date.toISOString().slice(0, 10),
        m.weightKg,
        m.bodyFatPct,
        m.chestCm,
        m.waistCm,
        m.hipsCm,
        m.armCm,
        m.note,
      ]),
    );
    return csvResponse(csv, exportFileName("measurements", "csv"));
  }

  if (format === "csv") {
    const workouts = await db.workout.findMany({
      where: { userId: user.id, status: "finished" },
      orderBy: { startedAt: "asc" },
      include: {
        exercises: {
          orderBy: { order: "asc" },
          include: { exercise: true, sets: { orderBy: { order: "asc" } } },
        },
      },
    });
    const rows = workouts.flatMap((w) =>
      w.exercises.flatMap((e) =>
        e.sets.map((s, i) => [
          w.startedAt.toISOString(),
          w.name,
          exerciseName(e.exercise, locale),
          i + 1,
          s.type,
          s.weightKg,
          s.reps,
          s.durationSec,
          s.distanceKm,
        ]),
      ),
    );
    const csv = toCsv(
      [
        "date",
        "workout",
        "exercise",
        "set",
        "type",
        "weight_kg",
        "reps",
        "duration_sec",
        "distance_km",
      ],
      rows,
    );
    return csvResponse(csv, exportFileName("sets", "csv"));
  }

  if (format !== "json") return Response.json({ error: "bad_format" }, { status: 400 });

  const [exercises, favorites, folders, templates, workouts, measurements, achievements] =
    await Promise.all([
      db.exercise.findMany({ where: { ownerId: user.id } }),
      db.favoriteExercise.findMany({ where: { userId: user.id } }),
      db.folder.findMany({ where: { userId: user.id } }),
      db.template.findMany({
        where: { userId: user.id },
        include: { items: { orderBy: { order: "asc" } } },
      }),
      db.workout.findMany({
        where: { userId: user.id },
        orderBy: { startedAt: "asc" },
        include: {
          exercises: {
            orderBy: { order: "asc" },
            include: { sets: { orderBy: { order: "asc" } } },
          },
        },
      }),
      db.bodyMeasurement.findMany({ where: { userId: user.id }, orderBy: { date: "asc" } }),
      db.userAchievement.findMany({ where: { userId: user.id } }),
    ]);

  const body = {
    exportedAt: new Date().toISOString(),
    version: 1,
    note: "Weights are in kilograms, circumferences in centimeters, dates in UTC.",
    profile: {
      email: user.email,
      name: user.name,
      goal: user.goal,
      experience: user.experience,
      weeklyGoal: user.weeklyGoal,
      units: user.units,
      locale: user.locale,
      theme: user.theme,
      effectsEnabled: user.effectsEnabled,
      restDefaultSec: user.restDefaultSec,
      createdAt: user.createdAt,
    },
    customExercises: exercises,
    favoriteExerciseIds: favorites.map((f) => f.exerciseId),
    folders,
    templates,
    workouts,
    measurements,
    achievements,
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      ...NO_STORE,
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFileName("data", "json")}"`,
    },
  });
}

function csvResponse(csv: string, filename: string) {
  return new Response(csv, {
    headers: {
      ...NO_STORE,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
