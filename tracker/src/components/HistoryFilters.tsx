"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PERIODS } from "@/lib/history";

export function HistoryFilters({ exercises }: { exercises: { id: string; name: string }[] }) {
  const t = useTranslations("history");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    // Актуальный адрес, а не params из замыкания — иначе быстрая смена двух фильтров теряет первый.
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  }

  const select =
    "min-h-11 rounded-control border border-border bg-surface-2 px-3 text-base text-text";
  return (
    <div className="flex flex-wrap gap-3">
      <label className="flex items-center gap-2 text-sm text-muted">
        {t("period")}
        <select
          value={params.get("period") ?? "all"}
          onChange={(e) => update("period", e.target.value === "all" ? "" : e.target.value)}
          className={select}
        >
          {PERIODS.map((p) => (
            <option key={p} value={p}>
              {t(`periods.${p}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-muted">
        {t("exercise")}
        <select
          value={params.get("exercise") ?? ""}
          onChange={(e) => update("exercise", e.target.value)}
          className={select}
        >
          <option value="">{t("anyExercise")}</option>
          {exercises.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
