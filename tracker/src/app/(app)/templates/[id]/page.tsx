import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { TemplateEditor } from "@/components/templates/TemplateEditor";
import { db } from "@/lib/db";
import { pickerExercises } from "@/lib/template-data";
import { deleteTemplate, saveTemplate } from "@/server/actions/templates";
import { requireUser } from "@/server/auth/session";
import { DeleteTemplateButton } from "./DeleteTemplateButton";

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const t = await getTranslations("templates");
  const locale = await getLocale();

  const tpl = await db.template.findFirst({
    where: { id, userId: user.id },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!tpl) notFound();

  const [exercises, folders] = await Promise.all([
    pickerExercises(user.id, locale),
    db.folder.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">{t("editTitle")}</h1>
      <TemplateEditor
        action={saveTemplate.bind(null, id)}
        submitLabel={t("save")}
        exercises={exercises}
        folders={folders.map((f) => ({ id: f.id, name: f.name }))}
        values={{
          name: tpl.name,
          note: tpl.note ?? "",
          weekday: tpl.weekday,
          folderId: tpl.folderId,
          items: tpl.items.map((i) => ({
            exerciseId: i.exerciseId,
            sets: i.targetSets,
            reps: i.targetReps,
          })),
        }}
      />
      <DeleteTemplateButton action={deleteTemplate.bind(null, id)} />
    </div>
  );
}
