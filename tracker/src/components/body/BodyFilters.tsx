"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BODY_METRICS } from "@/lib/body";
import { PERIODS } from "@/lib/history";

export function BodyFilters({ metric }: { metric: string }) {
  const t = useTranslations("body");
  const h = useTranslations("history");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const select =
    "min-h-11 rounded-control border border-border bg-surface-2 px-3 text-base text-text";
  return (
    <div className="flex flex-wrap gap-3">
      <label className="flex items-center gap-2 text-sm text-muted">
        {t("metric")}
        <select
          value={metric}
          onChange={(e) => update("metric", e.target.value)}
          className={select}
        >
          {BODY_METRICS.map((m) => (
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
