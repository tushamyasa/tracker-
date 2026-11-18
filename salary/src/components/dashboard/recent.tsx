"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import type { TransactionRow } from "@/actions/transactions";
import { useTransactionForm } from "@/components/layout/quick-add";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCategoryIcon } from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import { Money } from "./privacy";

export function RecentTransactions({ rows, currency }: { rows: TransactionRow[]; currency: string }) {
  const openForm = useTransactionForm();
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">Последние операции</h2>
        <Link href="/transactions" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
          Все операции
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="space-y-3 py-6 text-center">
          <p className="text-sm text-muted-foreground">Операций пока нет</p>
          <Button onClick={() => openForm()}>Добавить первую</Button>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => {
            const Icon = getCategoryIcon(r.categoryIcon ?? "wallet");
            const color = r.categoryColor ?? "#64748B";
            const d = new Date(r.date);
            return (
              <li key={r.id} className="flex items-center gap-3 py-2.5">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: color + "22", color }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 break-words text-sm font-medium">{r.categoryName ?? "Без категории"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                    {r.note ? ` · ${r.note}` : ""}
                  </p>
                </div>
                <Money
                  value={r.type === "income" ? r.amount : -r.amount}
                  currency={currency}
                  signed
                  className={cn(
                    "num text-sm font-semibold",
                    r.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                  )}
                />
                <Button variant="ghost" size="icon" aria-label="Редактировать операцию" onClick={() => openForm(r)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
