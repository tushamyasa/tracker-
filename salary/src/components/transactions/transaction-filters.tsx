"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormCategory } from "@/server/transactions";

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/** Фильтры живут в URL (?type=&category=&from=&to=&q=), страница перерисовывается на сервере. */
export function TransactionFilters({ categories }: { categories: FormCategory[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const type = params.get("type") ?? "";
  const categoryId = params.get("category") ?? "";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const urlQ = params.get("q") ?? "";

  const [q, setQ] = useState(urlQ);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Внешняя смена URL (например, «Сбросить») синхронизирует поле поиска.
  const [syncedQ, setSyncedQ] = useState(urlQ);
  if (syncedQ !== urlQ) {
    setSyncedQ(urlQ);
    setQ(urlQ);
  }
  useEffect(() => () => clearTimeout(debounce.current), []);

  function update(patch: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page"); // при смене фильтра возвращаемся на 1-ю страницу
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname));
  }

  const visibleCategories = categories.filter((c) => !type || c.type === type);
  const hasFilters = Boolean(type || categoryId || from || to || urlQ);

  return (
    <div
      className="grid grid-cols-2 gap-2 data-[pending=true]:opacity-70 md:grid-cols-6"
      data-pending={pending}
    >
      <Input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          clearTimeout(debounce.current);
          debounce.current = setTimeout(() => update({ q: e.target.value.trim() }), 350);
        }}
        placeholder="Поиск по заметке"
        aria-label="Поиск по заметке"
        className="col-span-2 md:col-span-2"
      />
      <select
        aria-label="Тип"
        className={selectClass}
        value={type}
        onChange={(e) => update({ type: e.target.value, category: "" })}
      >
        <option value="">Все типы</option>
        <option value="expense">Расходы</option>
        <option value="income">Доходы</option>
      </select>
      <select
        aria-label="Категория"
        className={selectClass}
        value={categoryId}
        onChange={(e) => update({ category: e.target.value })}
      >
        <option value="">Все категории</option>
        {visibleCategories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {!type ? (c.type === "income" ? " (доход)" : " (расход)") : ""}
          </option>
        ))}
      </select>
      <Input
        type="date"
        aria-label="Дата с"
        value={from}
        max={to || undefined}
        onChange={(e) => update({ from: e.target.value })}
      />
      <Input
        type="date"
        aria-label="Дата по"
        value={to}
        min={from || undefined}
        onChange={(e) => update({ to: e.target.value })}
      />
      {hasFilters ? (
        <Button
          variant="ghost"
          className="col-span-2 md:col-span-6 md:w-fit"
          onClick={() => startTransition(() => router.replace(pathname))}
        >
          <X className="size-4" /> Сбросить фильтры
        </Button>
      ) : null}
    </div>
  );
}
