import { getLocale, getTranslations } from "next-intl/server";
import { TemplateEditor } from "@/components/templates/TemplateEditor";
import { db } from "@/lib/db";
import { pickerExercises } from "@/lib/template-data";
import { saveTemplate } from "@/server/actions/templates";
import { requireUser } from "@/server/auth/session";

export default async function NewTemplatePage() {
  const user = await requireUser();
  const t = await getTranslations("templates");
  const locale = await getLocale();
  const [exercises, folders] = await Promise.all([
    pickerExercises(user.id, locale),
    db.folder.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">{t("newTitle")}</h1>
      <TemplateEditor
        action={saveTemplate.bind(null, null)}
        submitLabel={t("create")}
        exercises={exercises}
        folders={folders.map((f) => ({ id: f.id, name: f.name }))}
        values={{ name: "", note: "", weekday: null, folderId: null, items: [] }}
      />
    </div>
  );
}
