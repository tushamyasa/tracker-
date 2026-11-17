"use client";

import clsx from "clsx";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EQUIPMENT, MUSCLE_GROUPS } from "@/lib/exercises";

export function ExerciseFilters() {
  const t = useTranslations("exercises");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  function update(key: string, value: string) {
    // Берём актуальный адрес, а не params из замыкания: при быстрой смене
    // нескольких фильтров params может ещё не обновиться.
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`);
  }

  // Поиск с задержкой, чтобы не обновлять страницу на каждую букву.
  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const id = setTimeout(() => update("q", q), 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const muscle = params.get("muscle") ?? "";
  const equipment = params.get("equipment") ?? "";
  const fav = params.get("fav") === "1";

  const chip = (active: boolean) =>
    clsx(
      "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition",
      active ? "bg-accent text-white" : "bg-surface-2 text-muted hover:bg-border",
    );

  return (
    <div className="flex flex-col gap-3">
      <label className="relative block">
        <span className="sr-only">{t("search")}</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("search")}
          className="min-h-11 w-full rounded-control border border-border bg-surface-2 pl-10 pr-3 text-base"
        />
      </label>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        <button type="button" className={chip(!muscle)} onClick={() => update("muscle", "")}>
          {t("all")}
        </button>
        {MUSCLE_GROUPS.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={muscle === m}
            className={chip(muscle === m)}
            onClick={() => update("muscle", muscle === m ? "" : m)}
          >
            {t(`muscles.${m}`)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted">
          {t("equipmentLabel")}
          <select
            value={equipment}
            onChange={(e) => update("equipment", e.target.value)}
            className="min-h-11 rounded-control border border-border bg-surface-2 px-3 text-base text-text"
          >
            <option value="">{t("all")}</option>
            {EQUIPMENT.map((e) => (
              <option key={e} value={e}>
                {t(`equipment.${e}`)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          aria-pressed={fav}
          className={chip(fav)}
          onClick={() => update("fav", fav ? "" : "1")}
        >
          {t("favoritesOnly")}
        </button>
      </div>
    </div>
  );
}
