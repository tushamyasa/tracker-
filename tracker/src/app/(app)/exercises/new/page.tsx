import { getTranslations } from "next-intl/server";
import { ExerciseForm } from "@/components/exercises/ExerciseForm";
import { createExercise } from "@/server/actions/exercises";

export default async function NewExercisePage() {
  const t = await getTranslations("exercises");
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <h1 className="text-3xl font-extrabold">{t("newTitle")}</h1>
      <ExerciseForm
        action={createExercise}
        submitLabel={t("create")}
        values={{
          name: "",
          muscleGroup: "chest",
          equipment: "barbell",
          kind: "weight_reps",
          description: "",
          hasPhoto: false,
        }}
      />
    </div>
  );
}
