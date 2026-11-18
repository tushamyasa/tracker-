"use client";

import * as React from "react";
import { Pencil, ReceiptText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteTransaction, type TransactionRow } from "@/actions/transactions";
import { useTransactionForm } from "@/components/layout/quick-add";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { getCategoryIcon } from "@/lib/category-icons";
import { cn, formatCurrency } from "@/lib/utils";

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function dayLabel(d: Date, now: Date) {
  if (dayKey(d) === dayKey(now)) return "Сегодня";
  const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (dayKey(d) === dayKey(y)) return "Вчера";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: d.getFullYear() === now.getFullYear() ? undefined : "numeric", weekday: "short" });
}

export function TransactionsView({
  rows,
  currency,
  truncated,
}: {
  rows: TransactionRow[];
  currency: string;
  truncated: boolean;
}) {
  const openForm = useTransactionForm();
  const [toDelete, setToDelete] = React.useState<TransactionRow | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [now] = React.useState(() => new Date());

  const groups = React.useMemo(() => {
    const map = new Map<string, { date: Date; items: TransactionRow[] }>();
    for (const r of rows) {
      const d = new Date(r.date);
      const k = dayKey(d);
      if (!map.has(k)) map.set(k, { date: d, items: [] });
      map.get(k)!.items.push(r);
    }
    return [...map.values()];
  }, [rows]);

  const income = rows.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
  const expense = rows.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);

  function confirmDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      const res = await deleteTransaction(toDelete.id);
      if (!res.ok) return void toast.error(res.error);
      toast.success("Операция удалена");
      setToDelete(null);
    });
  }

  if (rows.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-12 text-center">
        <ReceiptText className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Операций не найдено</p>
        <Button onClick={() => openForm()}>Добавить операцию</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Доходы</p>
          <p className="num text-lg font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(income, currency)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Расходы</p>
          <p className="num text-lg font-semibold text-rose-600 dark:text-rose-400">{formatCurrency(expense, currency)}</p>
        </Card>
      </div>

      {groups.map(({ date, items }) => {
        const net = items.reduce((s, r) => s + (r.type === "income" ? r.amount : -r.amount), 0);
        return (
          <section key={dayKey(date)} aria-label={dayLabel(date, now)}>
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h2 className="text-sm font-semibold capitalize">{dayLabel(date, now)}</h2>
              <span className="num text-xs text-muted-foreground">
                {net > 0 ? "+" : net < 0 ? "−" : ""}
                {formatCurrency(Math.abs(net), currency)}
              </span>
            </div>
            <Card className="divide-y divide-border p-0">
              {items.map((r) => {
                const Icon = getCategoryIcon(r.categoryIcon ?? "wallet");
                const color = r.categoryColor ?? "#64748B";
                return (
                  <div key={r.id} className="flex items-center gap-3 p-3">
                    <button
                      type="button"
                      onClick={() => openForm(r)}
                      aria-label={`Изменить операцию: ${r.categoryName ?? "Без категории"}`}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left sm:pointer-events-none"
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
                        style={{ backgroundColor: color + "22", color }}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 break-words text-sm font-medium">
                          {r.categoryName ?? "Без категории"}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {new Date(r.date).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                          {r.note ? ` · ${r.note}` : ""}
                        </span>
                      </span>
                    </button>
                    <p
                      className={cn(
                        "num shrink-0 text-sm font-semibold",
                        r.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                      )}
                    >
                      {r.type === "income" ? "+" : "−"}
                      {formatCurrency(r.amount, currency)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Редактировать операцию"
                      onClick={() => openForm(r)}
                      className="hidden sm:inline-flex"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Удалить операцию" onClick={() => setToDelete(r)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </Card>
          </section>
        );
      })}

      {truncated && (
        <p className="text-center text-xs text-muted-foreground">Показаны первые 500 операций — уточните фильтры.</p>
      )}

      <Dialog open={toDelete !== null} onClose={() => setToDelete(null)} title="Удаление операции">
        {toDelete && (
          <div className="space-y-4">
            <p className="text-sm">
              Удалить операцию на {formatCurrency(toDelete.amount, currency)}? Это действие нельзя отменить.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setToDelete(null)} disabled={pending}>
                Отмена
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={pending}>
                Удалить
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
