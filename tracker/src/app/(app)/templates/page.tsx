import { Copy, FolderOpen, Plus, X } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { FolderForm } from "@/components/templates/FolderForm";
import { Card, Chip, EmptyState } from "@/components/ui/Card";
import { db } from "@/lib/db";
import { exerciseName } from "@/lib/exercises";
import { STARTERS } from "@/lib/templates";
import { addStarterTemplate, deleteFolder, duplicateTemplate } from "@/server/actions/templates";
import { startWorkout } from "@/server/actions/workouts";
import { requireUser } from "@/server/auth/session";
import { pageTitle } from "@/lib/page-title";

type TemplateRow = Awaited<ReturnType<typeof loadTemplates>>[number];

function loadTemplates(userId: string) {
  return db.template.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { items: { orderBy: { order: "asc" }, include: { exercise: true } } },
  });
}

export async function generateMetadata() {
  return { title: await pageTitle("templates.title") };
}

export default async function TemplatesPage() {
  const user = await requireUser();
  const t = await getTranslations("templates");
  const locale = await getLocale();
  const [templates, folders] = await Promise.all([
    loadTemplates(user.id),
    db.folder.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ]);

  function Row({ tpl }: { tpl: TemplateRow }) {
    return (
      <li>
        <Card className="flex flex-col gap-3 p-4" data-testid="template-card">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/templates/${tpl.id}`} className="min-w-0 flex-1">
              <div className="truncate font-heading text-lg font-bold">{tpl.name}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                <Chip active>{t("exerciseCount", { count: tpl.items.length })}</Chip>
                {tpl.weekday !== null && <Chip>{t(`weekdays.${tpl.weekday}`)}</Chip>}
              </div>
            </Link>
            <form action={duplicateTemplate.bind(null, tpl.id)}>
              <button
                type="submit"
                aria-label={`${t("duplicate")}: ${tpl.name}`}
                className="grid size-11 place-items-center rounded-control hover:bg-surface-2"
              >
                <Copy className="size-4" aria-hidden />
              </button>
            </form>
          </div>
          <p className="line-clamp-2 text-sm text-muted">
            {tpl.items.map((i) => exerciseName(i.exercise, locale)).join(" · ")}
          </p>
          <form action={startWorkout.bind(null, tpl.id)}>
            <button
              type="submit"
              aria-label={`${t("start")}: ${tpl.name}`}
              className="min-h-11 rounded-control bg-accent-soft px-4 text-sm font-semibold text-accent-text hover:opacity-90"
            >
              {t("start")}
            </button>
          </form>
        </Card>
      </li>
    );
  }

  const unfiled = templates.filter((tpl) => !tpl.folderId);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="min-w-0 text-2xl font-extrabold sm:text-3xl">{t("title")}</h1>
        <Link
          href="/templates/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-control bg-accent px-4 text-sm font-semibold text-white"
        >
          <Plus className="size-4" aria-hidden />
          {t("add")}
        </Link>
      </div>

      {templates.length === 0 && <EmptyState title={t("emptyTitle")} text={t("emptyText")} />}

      {unfiled.length > 0 && (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
          {unfiled.map((tpl) => (
            <Row key={tpl.id} tpl={tpl} />
          ))}
        </ul>
      )}

      {folders.map((f) => {
        const inFolder = templates.filter((tpl) => tpl.folderId === f.id);
        return (
          <section key={f.id} aria-label={f.name} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <FolderOpen className="size-5 text-muted" aria-hidden />
                {f.name}
              </h2>
              <form action={deleteFolder.bind(null, f.id)}>
                <button
                  type="submit"
                  aria-label={`${t("deleteFolder")}: ${f.name}`}
                  className="grid size-11 place-items-center rounded-control text-muted hover:bg-surface-2"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </form>
            </div>
            {inFolder.length === 0 ? (
              <p className="text-sm text-muted">{t("emptyFolder")}</p>
            ) : (
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
                {inFolder.map((tpl) => (
                  <Row key={tpl.id} tpl={tpl} />
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <FolderForm />

      <section aria-label={t("startersTitle")} className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t("startersTitle")}</h2>
        <p className="text-sm text-muted">{t("startersText")}</p>
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
          {STARTERS.map((s) => (
            <li
              key={s.key}
              className="flex items-center justify-between gap-3 rounded-card bg-surface p-4"
            >
              <span className="min-w-0 truncate font-semibold">
                {locale === "en" ? s.nameEn : s.nameRu}
              </span>
              <form action={addStarterTemplate.bind(null, s.key)}>
                <button
                  type="submit"
                  aria-label={`${t("addStarter")}: ${locale === "en" ? s.nameEn : s.nameRu}`}
                  className="min-h-11 rounded-control bg-surface-2 px-4 text-sm font-semibold hover:bg-border"
                >
                  {t("addStarter")}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
