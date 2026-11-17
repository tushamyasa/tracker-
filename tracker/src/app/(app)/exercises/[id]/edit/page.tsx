import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ExerciseForm } from "@/components/exercises/ExerciseForm";
import { db } from "@/lib/db";
import { updateExercise } from "@/server/actions/exercises";
import { requireUser } from "@/server/auth/session";

export default async function EditExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const t = await getTranslations("exercises");
  const e = await db.exercise.findFirst({ where: { id, ownerId: user.id } });
  if (!e) notFound();
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <h1 className="text-3xl font-extrabold">{t("editTitle")}</h1>
      <ExerciseForm
        action={updateExercise.bind(null, id)}
        submitLabel={t("save")}
        values={{
          name: e.nameRu,
          muscleGroup: e.muscleGroup,
          equipment: e.equipment,
          kind: e.kind,
          description: e.description ?? "",
          hasPhoto: !!e.mediaUrl,
        }}
      />
    </div>
  );
}
