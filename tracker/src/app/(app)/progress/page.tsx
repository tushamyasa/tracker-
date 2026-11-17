import { BarChart3, Trophy } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { Heatmap } from "@/components/progress/Heatmap";
import { ProgressChart } from "@/components/progress/ProgressChart";
import { ProgressFilters } from "@/components/progress/ProgressFilters";
import { Card, EmptyState } from "@/components/ui/Card";
import { db } from "@/lib/db";
import { exerciseName, MUSCLE_GROUPS } from "@/lib/exercises";
import { isPeriod, periodStart } from "@/lib/history";
import { loadHistorySamples, groupByExercise } from "@/lib/progress-data";
import { buildHeatmap, buildSeries, chartMetricsForKind, setsByMuscle } from "@/lib/progress";
import { chartUnit, chartValue, formatRecordValue } from "@/lib/record-format";
import { metricsOf, RECORD_TYPES, scanHistory, type RecordType } from "@/lib/records";
import type { Units } from "@/lib/units";
import { requireUser } from "@/server/auth/session";
import { pageTitle } from "@/lib/page-title";

export async function generateMetadata() {
  return { title: await pageTitle("nav.progress") };
}

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ exercise?: string; metric?: string; period?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const t = await getTranslations("progress");
  const ex = await getTranslations("exercises");
  const locale = await getLocale();
  const format = await getFormatter();
  const units = user.units as Units;

  const period = isPeriod(sp.period) ? sp.period : "all";
  const since = periodStart(period);

  const [samples, exercises, starts] = await Promise.all([
    loadHistorySamples(user.id),
    db.exercise.findMany({ where: { OR: [{ ownerId: null }, { ownerId: user.id }] } }),
    db.workout.findMany({
      where: {
        userId: user.id,
        status: "finished",
        startedAt: { gte: new Date(Date.now() - 366 * 86_400_000) },
      },
      select: { startedAt: true },
    }),
  ]);

  if (samples.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{t("title")}</h1>
        <EmptyState
          icon={<BarChart3 className="size-8" aria-hidden />}
          title={t("emptyTitle")}
          text={t("emptyText")}
          action={
            <Link
              href="/workout/active"
              className="inline-flex min-h-11 items-center rounded-control bg-accent px-4 text-sm font-semibold text-white"
            >
              {t("startWorkout")}
            </Link>
          }
        />
      </div>
    );
  }

  const nameOf = new Map(exercises.map((e) => [e.id, exerciseName(e, locale)]));
  const byExercise = groupByExercise(samples);

  // Упражнения с историей, самое свежее — по умолчанию.
  const used = [...byExercise.entries()]
    .map(([id, list]) => ({
      id,
      name: nameOf.get(id) ?? "—",
      last: Math.max(...list.map((h) => h.startedAt.getTime())),
    }))
    .sort((a, b) => b.last - a.last);
  const selected = used.find((u) => u.id === sp.exercise) ?? used[0];
  const history = byExercise.get(selected.id)!;
  const kind = history[0].kind;

  const metrics = chartMetricsForKind(kind);
  const metric: RecordType = (metrics as string[]).includes(sp.metric ?? "")
    ? (sp.metric as RecordType)
    : metrics[0];

  const series = buildSeries(
    history.map((h) => ({ sample: h.sample, startedAt: h.startedAt })),
    kind,
    metric,
    since,
  );
  const chartData = series.map((p) => ({
    at: p.at,
    value: chartValue(metric, p.value, units),
    isPR: p.isPR,
  }));
  const unit = chartUnit(metric, units);

  const { bests } = scanHistory(
    history.map((h) => h.sample),
    kind,
  );

  // Лента рекордов по всем упражнениям.
  const feed = [...byExercise.entries()]
    .flatMap(([exerciseId, list]) => {
      const feedKind = list[0].kind;
      const startedById = new Map(list.map((h) => [h.sample.id, h.startedAt]));
      return scanHistory(
        list.map((h) => h.sample),
        feedKind,
      ).events.map((e) => ({
        exerciseId,
        kind: feedKind,
        startedAt: startedById.get(e.set.id)!,
        ...e,
      }));
    })
    .sort((a, b) => b.set.at - a.set.at)
    .slice(0, 12);

  // Нагрузка по группам мышц за период.
  const periodSamples = samples.filter((h) => !since || h.startedAt >= since);
  const muscle = setsByMuscle(
    periodSamples.map((h) => ({ muscleGroup: h.muscleGroup, sample: h.sample })),
  );
  const muscleRows = MUSCLE_GROUPS.filter((m) => (muscle[m] ?? 0) > 0)
    .map((m) => ({ group: m, sets: muscle[m] }))
    .sort((a, b) => b.sets - a.sets);
  const maxSets = Math.max(1, ...muscleRows.map((r) => r.sets));

  const weeks = buildHeatmap(starts.map((s) => s.startedAt));
  const trainedDays = weeks.flat().filter((c) => c && c.count > 0).length;

  const dateFmt = (ms: number) =>
    format.dateTime(ms, { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{t("title")}</h1>
        <Link href="/body" className="text-sm text-accent-text underline">
          {t("bodyLink")}
        </Link>
      </div>

      <ProgressFilters
        exercises={used.map((u) => ({ id: u.id, name: u.name }))}
        metrics={metrics}
        selectedExercise={selected.id}
        selectedMetric={metric}
      />

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">
          {selected.name} · {t(`metrics.${metric}`)}
          {unit ? `, ${unit}` : ""}
        </h2>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted" data-testid="chart-empty">
            {t("noDataPeriod")}
          </p>
        ) : (
          <>
            <ProgressChart data={chartData} locale={locale} unit={unit} />
            <details>
              <summary className="cursor-pointer text-sm text-muted">{t("showTable")}</summary>
              <table className="mt-2 w-full text-sm" data-testid="chart-table">
                <thead>
                  <tr className="text-left text-muted">
                    <th className="py-1 font-medium">{t("date")}</th>
                    <th className="py-1 font-medium">{t(`metrics.${metric}`)}</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((p) => (
                    <tr key={p.at} className="border-t border-border">
                      <td className="py-1">{dateFmt(p.at)}</td>
                      <td className="py-1 font-semibold">
                        {p.value} {unit} {p.isPR ? "🏆" : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        )}
      </Card>

      <section aria-label={t("recordsTitle")} className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t("recordsTitle")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="records-grid">
          {RECORD_TYPES.filter((r) => bests[r] !== undefined).map((r) => (
            <Card key={r} className="p-4">
              <div className="text-xs text-muted">{t(`recordNames.${r}`)}</div>
              <div className="font-heading text-xl font-extrabold" data-testid={`record-${r}`}>
                {formatRecordValue(r, bests[r]!, units)}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Card className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold">{t("heatmapTitle")}</h2>
          <span className="text-sm text-muted" data-testid="heatmap-days">
            {t("trainedDays", { count: trainedDays })}
          </span>
        </div>
        <Heatmap
          weeks={weeks}
          label={t("heatmapTitle")}
          cellLabel={(key, count) => `${key}: ${count}`}
        />
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t("muscleTitle")}</h2>
        {muscleRows.length === 0 ? (
          <p className="text-sm text-muted">{t("noDataPeriod")}</p>
        ) : (
          <ul className="flex flex-col gap-2" data-testid="muscle-list">
            {muscleRows.map((r) => (
              <li
                key={r.group}
                className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-3 text-sm"
              >
                <span className="truncate">{ex(`muscles.${r.group}`)}</span>
                <span className="h-3 overflow-hidden rounded-full bg-surface-2">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${(r.sets / maxSets) * 100}%` }}
                  />
                </span>
                <span className="text-right font-semibold">{r.sets}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <section aria-label={t("feedTitle")} className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t("feedTitle")}</h2>
        {feed.length === 0 ? (
          <p className="text-sm text-muted" data-testid="feed-empty">
            {t("feedEmpty")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2" data-testid="records-feed">
            {feed.map((e) => (
              <li
                key={`${e.set.id}`}
                className="flex items-center gap-3 rounded-card bg-surface p-3"
              >
                <Trophy className="size-5 shrink-0 text-gold" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{nameOf.get(e.exerciseId) ?? "—"}</div>
                  <div className="text-sm text-muted">
                    {e.types
                      .map(
                        (r) =>
                          `${t(`recordNames.${r}`)}: ${formatRecordValue(r, metricsOf(e.set, e.kind)[r] ?? 0, units)}`,
                      )
                      .join(", ")}
                  </div>
                </div>
                <time className="shrink-0 text-xs text-muted">
                  {dateFmt(e.startedAt.getTime())}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
