import { getLocale, getTranslations } from "next-intl/server";
import { WorkoutEditor } from "@/components/workout/WorkoutEditor";
import { pickerExercises } from "@/lib/template-data";
import type { Units } from "@/lib/units";
import { saveWorkoutEdit } from "@/server/actions/history";
import { requireUser } from "@/server/auth/session";

export default async function NewPastWorkoutPage() {
  const user = await requireUser();
  const t = await getTranslations("history");
  const locale = await getLocale();
  const catalog = await pickerExercises(user.id, locale);
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">{t("newTitle")}</h1>
      <p className="text-sm text-muted">{t("newText")}</p>
      <WorkoutEditor
        action={saveWorkoutEdit.bind(null, null)}
        submitLabel={t("create")}
        catalog={catalog}
        units={user.units as Units}
        values={{
          name: locale === "en" ? "Workout" : "Тренировка",
          startedAt: null,
          durationMin: 60,
          note: "",
          feeling: null,
          exercises: [],
        }}
      />
    </div>
  );
}
