"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { CategoryOption } from "@/actions/transactions";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Period = "today" | "week" | "month" | "all" | "custom";

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Сегодня" },
  { id: "week", label: "Неделя" },
  { id: "month", label: "Месяц" },
  { id: "all", label: "Всё время" },
  { id: "custom", label: "Период" },
];

/** Границы периода в локальной зоне браузера (мс Unix). */
export function periodRange(p: Exclude<Period, "custom" | "all">, now = new Date()): { from: number; to: number } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (p === "today") return { from: start.getTime(), to: start.getTime() + 86_400_000 - 1 };
  if (p === "week") {
    const dow = (start.getDay() + 6) % 7; // понедельник = 0
    const from = new Date(start.getFullYear(), start.getMonth(), start.getDate() - dow);
    const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7);
    return { from: from.getTime(), to: to.getTime() - 1 };
  }
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { from: from.getTime(), to: to.getTime() - 1 };
}

const dayInput = (ms?: string | null) => {
  if (!ms) return "";
  const d = new Date(Number(ms));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export function Filters({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const period = (sp.get("period") as Period | null) ?? "month";
  const type = sp.get("type") ?? "all";
  const selected = (sp.get("cat") ?? "").split(",").filter(Boolean);
  const [q, setQ] = React.useState(sp.get("q") ?? "");

  const update = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [sp, router, pathname],
  );

  // Без параметров периода открываем текущий месяц по локальному времени браузера
  React.useEffect(() => {
    if (!sp.get("period")) {
      const r = periodRange("month");
      update({ period: "month", from: String(r.from), to: String(r.to) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Поиск с задержкой
  React.useEffect(() => {
    if (q === (sp.get("q") ?? "")) return;
    const t = setTimeout(() => update({ q }), 350);
    return () => clearTimeout(t);
  }, [q, sp, update]);

  function setPeriod(p: Period) {
    if (p === "all") return update({ period: p, from: null, to: null });
    if (p === "custom") return update({ period: p });
    const r = periodRange(p);
    update({ period: p, from: String(r.from), to: String(r.to) });
  }

  function setDay(key: "from" | "to", value: string) {
    if (!value) return update({ [key]: null });
    const [y, m, d] = value.split("-").map(Number);
    const date = key === "from" ? new Date(y, m - 1, d) : new Date(y, m - 1, d, 23, 59, 59, 999);
    update({ period: "custom", [key]: String(date.getTime()) });
  }

  function toggleCategory(id: string) {
    const next = selected.includes(id) ? selected.filter((c) => c !== id) : [...selected, id];
    update({ cat: next.join(",") });
  }

  const visibleCats = categories.filter((c) => type === "all" || c.type === type);
  const chip = (active: boolean) =>
    cn(
      "h-8 shrink-0 rounded-md border px-3 text-sm transition-colors",
      active
        ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        : "border-border text-muted-foreground hover:bg-foreground/5",
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по заметкам"
            aria-label="Поиск по заметкам"
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-md border border-border p-1" role="tablist" aria-label="Тип">
          {[
            ["all", "Все"],
            ["income", "Доходы"],
            ["expense", "Расходы"],
          ].map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={type === id}
              onClick={() => update({ type: id === "all" ? null : id, cat: null })}
              className={cn(
                "rounded-md px-3 text-sm font-medium transition-colors",
                type === id ? "bg-foreground/10" : "text-muted-foreground hover:bg-foreground/5",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {PERIODS.map((p) => (
          <button key={p.id} onClick={() => setPeriod(p.id)} aria-pressed={period === p.id} className={chip(period === p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <div className="grid max-w-md grid-cols-2 gap-2">
          <Input type="date" aria-label="С даты" value={dayInput(sp.get("from"))} onChange={(e) => setDay("from", e.target.value)} />
          <Input type="date" aria-label="По дату" value={dayInput(sp.get("to"))} onChange={(e) => setDay("to", e.target.value)} />
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Категории">
        {visibleCats.map((c) => (
          <button key={c.id} onClick={() => toggleCategory(c.id)} aria-pressed={selected.includes(c.id)} className={chip(selected.includes(c.id))}>
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
