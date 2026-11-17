import { Ruler, X } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { BodyFilters } from "@/components/body/BodyFilters";
import { BodyForm } from "@/components/body/BodyForm";
import { ProgressChart } from "@/components/progress/ProgressChart";
import { Card } from "@/components/ui/Card";
import {
  BODY_METRICS,
  bodyUnit,
  buildBodySeries,
  displayValue,
  latestWithDelta,
  rawValue,
  type BodyMetric,
} from "@/lib/body";
import { db } from "@/lib/db";
import { isPeriod, periodStart } from "@/lib/history";
import type { Units } from "@/lib/units";
import { deleteMeasurement } from "@/server/actions/body";
import { requireUser } from "@/server/auth/session";
import { pageTitle } from "@/lib/page-title";

export async function generateMetadata() {
  return { title: await pageTitle("body.title") };
}

export default async function BodyPage({
  searchParams,
}: {
  searchParams: Promise<{ metric?: string; period?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const t = await getTranslations("body");
  const locale = await getLocale();
  const format = await getFormatter();
  const units = user.units as Units;

  const list = await db.bodyMeasurement.findMany({
    where: { userId: user.id },
    orderBy: { date: "asc" },
  });

  const metric: BodyMetric = (BODY_METRICS as readonly string[]).includes(sp.metric ?? "")
    ? (sp.metric as BodyMetric)
    : "weight";
  const period = isPeriod(sp.period) ? sp.period : "all";
  const series = buildBodySeries(list, metric, units, periodStart(period));
  const unit = bodyUnit(metric, units);
  const dateFmt = (d: Date) =>
    format.dateTime(d, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

  const latest = BODY_METRICS.map((m) => ({ m, info: latestWithDelta(list, m, units) })).filter(
    (x) => x.info !== null,
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">{t("title")}</h1>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">{t("addTitle")}</h2>
        <p className="text-sm text-muted">{t("addText")}</p>
        <BodyForm units={units} />
      </Card>

      {list.length === 0 ? (
        <p className="text-muted" data-testid="body-empty">
          {t("empty")}
        </p>
      ) : (
        <>
          <section aria-label={t("latest")} className="flex flex-col gap-3">
            <h2 className="text-lg font-bold">{t("latest")}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-testid="body-latest">
              {latest.map(({ m, info }) => (
                <Card key={m} className="p-4">
                  <div className="text-xs text-muted">{t(`metrics.${m}`)}</div>
                  <div className="font-heading text-xl font-extrabold" data-testid={`latest-${m}`}>
                    {info!.value} {bodyUnit(m, units)}
                  </div>
                  {info!.delta !== null && (
                    <div className="text-xs font-semibold text-muted" data-testid={`delta-${m}`}>
                      {info!.delta > 0 ? "+" : ""}
                      {info!.delta} {bodyUnit(m, units)}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </section>

          <Card className="flex flex-col gap-4">
            <h2 className="text-lg font-bold">
              {t(`metrics.${metric}`)}, {unit}
            </h2>
            <BodyFilters metric={metric} />
            {series.length === 0 ? (
              <p className="text-sm text-muted" data-testid="body-chart-empty">
                {t("noData")}
              </p>
            ) : (
              <>
                <ProgressChart
                  data={series.map((p) => ({ ...p, isPR: false }))}
                  locale={locale}
                  unit={unit}
                  timeZone="UTC"
                />
                <details>
                  <summary className="cursor-pointer text-sm text-muted">{t("showTable")}</summary>
                  <table className="mt-2 w-full text-sm" data-testid="body-chart-table">
                    <tbody>
                      {series.map((p) => (
                        <tr key={p.at} className="border-t border-border">
                          <td className="py-1">{dateFmt(new Date(p.at))}</td>
                          <td className="py-1 text-right font-semibold">
                            {p.value} {unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              </>
            )}
          </Card>

          <section aria-label={t("history")} className="flex flex-col gap-3">
            <h2 className="text-lg font-bold">{t("history")}</h2>
            <ul className="flex flex-col gap-2" data-testid="body-history">
              {[...list].reverse().map((m) => (
                <li key={m.id} className="flex items-start gap-3 rounded-card bg-surface p-3">
                  <Ruler className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{dateFmt(m.date)}</div>
                    <div className="text-sm text-muted">
                      {BODY_METRICS.flatMap((k) => {
                        const raw = rawValue(m, k);
                        return raw === null
                          ? []
                          : [
                              `${t(`metrics.${k}`)} ${displayValue(k, raw, units)} ${bodyUnit(k, units)}`,
                            ];
                      }).join(" · ")}
                    </div>
                    {m.note && <div className="mt-1 text-sm">{m.note}</div>}
                  </div>
                  <form action={deleteMeasurement.bind(null, m.id)}>
                    <button
                      type="submit"
                      aria-label={`${t("delete")}: ${dateFmt(m.date)}`}
                      className="grid size-11 place-items-center rounded-control text-muted hover:bg-surface-2"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
