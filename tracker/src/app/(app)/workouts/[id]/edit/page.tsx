import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { WorkoutEditor } from "@/components/workout/WorkoutEditor";
import { db } from "@/lib/db";
import { pickerExercises } from "@/lib/template-data";
import type { Units } from "@/lib/units";
import type { SetType } from "@/lib/workout-types";
import { saveWorkoutEdit } from "@/server/actions/history";
import { requireUser } from "@/server/auth/session";

export default async function EditWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const t = await getTranslations("history");
  const locale = await getLocale();

  const w = await db.workout.findFirst({
    where: { id, userId: user.id, status: "finished" },
    include: {
      exercises: { orderBy: { order: "asc" }, include: { sets: { orderBy: { order: "asc" } } } },
    },
  });
  if (!w) notFound();
  const catalog = await pickerExercises(user.id, locale);
  const durationMin = w.finishedAt
    ? Math.max(1, Math.round((w.finishedAt.getTime() - w.startedAt.getTime()) / 60_000))
    : 60;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">{t("editTitle")}</h1>
      <WorkoutEditor
        action={saveWorkoutEdit.bind(null, id)}
        submitLabel={t("save")}
        catalog={catalog}
        units={user.units as Units}
        values={{
          name: w.name,
          startedAt: w.startedAt.toISOString(),
          durationMin,
          note: w.note ?? "",
          feeling: w.feeling,
          exercises: w.exercises.map((e) => ({
            exerciseId: e.exerciseId,
            sets: e.sets.map((s) => ({
              type: s.type as SetType,
              weightKg: s.weightKg,
              reps: s.reps,
              durationSec: s.durationSec,
              distanceKm: s.distanceKm,
            })),
          })),
        }}
      />
    </div>
  );
}
