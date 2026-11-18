"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  createTransaction,
  updateTransaction,
  type CategoryOption,
  type TransactionRow,
} from "@/actions/transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCategoryIcon } from "@/lib/category-icons";
import { cn } from "@/lib/utils";

type Type = "income" | "expense";

/** Date → значение для <input type="datetime-local"> в локальной зоне. */
export function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function TransactionForm({
  categories,
  transaction,
  onDone,
}: {
  categories: CategoryOption[];
  transaction?: TransactionRow;
  onDone: () => void;
}) {
  const [type, setType] = React.useState<Type>(transaction?.type ?? "expense");
  const [amount, setAmount] = React.useState(transaction ? String(transaction.amount) : "");
  const [categoryId, setCategoryId] = React.useState(transaction?.categoryId ?? "");
  const [date, setDate] = React.useState(toLocalInput(transaction ? new Date(transaction.date) : new Date()));
  const [note, setNote] = React.useState(transaction?.note ?? "");
  const [error, setError] = React.useState<string>();
  const [pending, startTransition] = React.useTransition();

  const options = categories.filter((c) => c.type === type);

  function changeType(t: Type) {
    setType(t);
    setCategoryId("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    const value = Number(amount.replace(/\s/g, "").replace(",", "."));
    if (!amount || Number.isNaN(value)) return setError("Введите сумму");
    const ts = new Date(date).getTime();
    if (Number.isNaN(ts)) return setError("Укажите дату");

    startTransition(async () => {
      const input = { type, amount: value, categoryId, date: ts, note: note || undefined };
      const res = transaction ? await updateTransaction(transaction.id, input) : await createTransaction(input);
      if (!res.ok) return setError(res.error);
      toast.success(transaction ? "Операция обновлена" : "Операция добавлена");
      onDone();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-md border border-border p-1" role="radiogroup" aria-label="Тип">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => changeType(t)}
            className={cn(
              "h-9 rounded-md text-sm font-medium transition-colors",
              type === t
                ? t === "income"
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-rose-500 text-white"
                : "text-muted-foreground hover:bg-foreground/10",
            )}
          >
            {t === "income" ? "Доход" : "Расход"}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="tx-amount" className="mb-1 block text-xs font-medium text-muted-foreground">
          Сумма
        </label>
        <Input
          id="tx-amount"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.,\s]/g, ""))}
          className={cn(
            "num h-12 text-xl font-semibold",
            type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
          )}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Категория</p>
        {options.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет категорий этого типа — создайте их в разделе «Категории».</p>
        ) : (
          <div className="grid max-h-40 grid-cols-3 gap-2 overflow-y-auto" role="radiogroup" aria-label="Категория">
            {options.map((c) => {
              const Icon = getCategoryIcon(c.icon);
              const active = categoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setCategoryId(c.id)}
                  style={active ? { borderColor: c.color, backgroundColor: c.color + "22" } : undefined}
                  className="flex flex-col items-center gap-1 rounded-md border border-border p-2 text-center text-xs transition-colors hover:bg-foreground/5"
                >
                  <Icon className="h-5 w-5" style={{ color: c.color }} />
                  <span className="w-full truncate">{c.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="tx-date" className="mb-1 block text-xs font-medium text-muted-foreground">
            Дата и время
          </label>
          <Input id="tx-date" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="tx-note" className="mb-1 block text-xs font-medium text-muted-foreground">
            Заметка
          </label>
          <Input id="tx-note" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder="Необязательно" />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-rose-500">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Отмена
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Сохранение…" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
