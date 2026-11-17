"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PERIODS } from "@/lib/history";

export function ProgressFilters({
  exercises,
  metrics,
  selectedExercise,
  selectedMetric,
}: {
  exercises: { id: string; name: string }[];
  metrics: string[];
  selectedExercise: string;
  selectedMetric: string;
}) {
  const t = useTranslations("progress");
  const h = useTranslations("history");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    // при смене упражнения метрика может оказаться недоступной
    if (key === "exercise") next.delete("metric");
    router.replace(`${pathname}?${next.toString()}`);
  }

  const select =
    "min-h-11 rounded-control border border-border bg-surface-2 px-3 text-base text-text";
  return (
    <div className="flex flex-wrap gap-3">
      <label className="flex items-center gap-2 text-sm text-muted">
        {t("exercise")}
        <select
          value={selectedExercise}
          onChange={(e) => update("exercise", e.target.value)}
          className={select}
        >
          {exercises.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-muted">
        {t("metric")}
        <select
          value={selectedMetric}
          onChange={(e) => update("metric", e.target.value)}
          className={select}
        >
          {metrics.map((m) => (
            <option key={m} value={m}>
              {t(`metrics.${m}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-muted">
        {h("period")}
        <select
          value={params.get("period") ?? "all"}
          onChange={(e) => update("period", e.target.value === "all" ? "" : e.target.value)}
          className={select}
        >
          {PERIODS.map((p) => (
            <option key={p} value={p}>
              {h(`periods.${p}`)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
