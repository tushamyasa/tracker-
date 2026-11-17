import { ClipboardList, Play, Plus } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { HistoryFilters } from "@/components/HistoryFilters";
import { Card, Chip, EmptyState } from "@/components/ui/Card";
import { db } from "@/lib/db";
import { exerciseName } from "@/lib/exercises";
import { isPeriod, PAGE_SIZE, periodStart } from "@/lib/history";
import { formatDuration, kgToDisplay, unitLabel, type Units } from "@/lib/units";
import { requireUser } from "@/server/auth/session";
import { pageTitle } from "@/lib/page-title";

export async function generateMetadata() {
  return { title: await pageTitle("nav.workouts") };
}

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; exercise?: string; page?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const t = await getTranslations("history");
  const nav = await getTranslations("nav");
  const locale = await getLocale();
  const format = await getFormatter();
  const units = user.units as Units;

  const period = isPeriod(sp.period) ? sp.period : "all";
  const from = periodStart(period);
  const page = Math.max(1, Math.floor(Number(sp.page) || 1));

  const where = {
    userId: user.id,
    status: "finished",
    ...(from ? { startedAt: { gte: from } } : {}),
    ...(sp.exercise ? { exercises: { some: { exerciseId: sp.exercise } } } : {}),
  };

  const [rows, total, active, usedExercises] = await Promise.all([
    db.workout.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        exercises: { orderBy: { order: "asc" }, include: { exercise: true, _count: true } },
      },
    }),
    db.workout.count({ where }),
    db.workout.findFirst({ where: { userId: user.id, status: "active" }, select: { id: true } }),
    db.workoutExercise.findMany({
      where: { workout: { userId: user.id, status: "finished" } },
      distinct: ["exerciseId"],
      select: { exercise: true },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filterOptions = usedExercises
    .map((u) => ({ id: u.exercise.id, name: exerciseName(u.exercise, locale) }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));

  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    if (sp.period) q.set("period", sp.period);
    if (sp.exercise) q.set("exercise", sp.exercise);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/workouts?${s}` : "/workouts";
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="min-w-0 text-2xl font-extrabold sm:text-3xl">{nav("workouts")}</h1>
        <Link
          href="/workouts/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-control bg-surface-2 px-4 text-sm font-semibold"
        >
          <Plus className="size-4" aria-hidden />
          {t("addPast")}
        </Link>
      </div>

      {active && (
        <Link
          href="/workout/active"
          className="flex items-center gap-3 rounded-card bg-accent p-4 font-semibold text-white"
        >
          <Play className="size-5" aria-hidden />
          {t("activeBanner")}
        </Link>
      )}

      <Link href="/templates">
        <Card className="flex items-center gap-4 p-4 hover:bg-surface-2">
          <ClipboardList className="size-6 text-accent-text" aria-hidden />
          <div>
            <div className="font-heading font-bold">{t("templates")}</div>
            <div className="text-sm text-muted">{t("templatesText")}</div>
          </div>
        </Card>
      </Link>

      <HistoryFilters exercises={filterOptions} />

      <p className="text-sm text-muted" data-testid="history-count">
        {t("found", { count: total })}
      </p>

      {rows.length === 0 ? (
        <EmptyState
          title={total === 0 && !sp.period && !sp.exercise ? t("emptyTitle") : t("nothingFound")}
          text={total === 0 && !sp.period && !sp.exercise ? t("emptyText") : t("nothingFoundText")}
        />
      ) : (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-3">
          {rows.map((w) => {
            const durationSec = w.finishedAt
              ? (w.finishedAt.getTime() - w.startedAt.getTime()) / 1000
              : 0;
            return (
              <li key={w.id}>
                <Link href={`/workouts/${w.id}`}>
                  <Card
                    className="flex flex-col gap-2 p-4 hover:bg-surface-2"
                    data-testid="history-card"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="truncate font-heading text-lg font-bold">{w.name}</h2>
                      <time
                        dateTime={w.startedAt.toISOString()}
                        className="shrink-0 text-sm text-muted"
                      >
                        {format.dateTime(w.startedAt, { dateStyle: "medium" })}
                      </time>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Chip active>{formatDuration(durationSec)}</Chip>
                      <Chip>
                        {Math.round(kgToDisplay(w.totalVolume, units)).toLocaleString(locale)}{" "}
                        {unitLabel(units)}
                      </Chip>
                      <Chip>{t("exerciseCount", { count: w.exercises.length })}</Chip>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted">
                      {w.exercises.map((e) => exerciseName(e.exercise, locale)).join(" · ")}
                    </p>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label={t("pagination")} className="flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link
              href={pageHref(page - 1)}
              className="min-h-11 rounded-control bg-surface-2 px-4 py-3 text-sm font-semibold"
            >
              {t("prev")}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted">{t("pageOf", { page, pages })}</span>
          {page < pages ? (
            <Link
              href={pageHref(page + 1)}
              className="min-h-11 rounded-control bg-surface-2 px-4 py-3 text-sm font-semibold"
            >
              {t("next")}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
