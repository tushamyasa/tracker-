"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { CategoryBadge } from "@/components/categories/category-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TransactionType } from "@/db/schema";
import { todayString } from "@/lib/dates";
import { minorToInputString } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  createTransactionAction,
  listFormCategoriesAction,
  updateTransactionAction,
  type TransactionActionResult,
  type TransactionFieldErrors,
} from "@/server/actions/transactions";
import type { FormCategory } from "@/server/transactions";

/** Сериализуемое представление операции для редактирования. */
export type EditableTransaction = {
  id: string;
  type: TransactionType;
  amount: number; // копейки
  categoryId: string;
  date: string;
  note: string | null;
  /** Данные категории — на случай, если она в архиве и не пришла в список активных. */
  category: FormCategory;
};

const TYPES: { value: TransactionType; label: string }[] = [
  { value: "expense", label: "Расход" },
  { value: "income", label: "Доход" },
];

export function TransactionForm({
  tx,
  onDone,
}: {
  tx: EditableTransaction | null;
  onDone: () => void;
}) {
  const [type, setType] = useState<TransactionType>(tx?.type ?? "expense");
  const [amount, setAmount] = useState(tx ? minorToInputString(tx.amount).replace(".", ",") : "");
  const [categoryId, setCategoryId] = useState(tx?.categoryId ?? "");
  const [date, setDate] = useState(tx?.date ?? todayString());
  const [note, setNote] = useState(tx?.note ?? "");
  const [categories, setCategories] = useState<FormCategory[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [errors, setErrors] = useState<TransactionFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    listFormCategoriesAction()
      .then((list) => !cancelled && setCategories(list))
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  // Активные категории + (при редактировании) текущая, даже если она в архиве.
  const all = categories
    ? tx && !categories.some((c) => c.id === tx.categoryId)
      ? [...categories, tx.category]
      : categories
    : [];
  const options = all.filter((c) => c.type === type);

  function changeType(next: TransactionType) {
    setType(next);
    const current = all.find((c) => c.id === categoryId);
    if (current && current.type !== next) setCategoryId("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    const payload = { type, amount, categoryId, date, note };

    startTransition(async () => {
      const result: TransactionActionResult = tx
        ? await updateTransactionAction(tx.id, payload)
        : await createTransactionAction(payload);

      if (result.ok) {
        toast.success(tx ? "Операция сохранена" : "Операция добавлена");
        onDone();
      } else {
        setErrors(result.fieldErrors ?? {});
        if (!result.fieldErrors) setFormError(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col" noValidate>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4">
        <div role="radiogroup" aria-label="Тип операции" className="grid grid-cols-2 rounded-lg border bg-surface p-1">
          {TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={type === value}
              onClick={() => changeType(value)}
              className={cn(
                "h-9 rounded-md text-sm font-medium transition-colors",
                type === value
                  ? value === "income"
                    ? "bg-income/15 text-income"
                    : "bg-expense/15 text-expense"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tx-amount">Сумма</Label>
          <Input
            id="tx-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0,00"
            autoComplete="off"
            autoFocus
            aria-invalid={errors.amount ? true : undefined}
            aria-describedby={errors.amount ? "tx-amount-error" : undefined}
            className={cn(
              "tabular h-12 text-2xl font-semibold md:text-2xl",
              type === "income" ? "text-income" : "text-expense",
            )}
          />
          {errors.amount ? (
            <p id="tx-amount-error" className="text-sm text-expense">
              {errors.amount}
            </p>
          ) : null}
        </div>

        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium">Категория</legend>
          {loadError ? (
            <p className="text-sm text-expense">Не удалось загрузить категории. Закройте и откройте форму снова.</p>
          ) : categories === null ? (
            <p className="text-sm text-muted-foreground">Загрузка…</p>
          ) : options.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Нет активных категорий этого типа. Создайте их в разделе «Категории».
            </p>
          ) : (
            <div role="radiogroup" aria-label="Категория" className="grid grid-cols-3 gap-2">
              {options.map((c) => {
                const selected = c.id === categoryId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setCategoryId(c.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center text-xs transition-colors",
                      selected ? "border-primary bg-primary/10" : "border-transparent hover:bg-accent",
                    )}
                  >
                    <CategoryBadge icon={c.icon} color={c.color} />
                    <span className="line-clamp-2 leading-tight">{c.name}</span>
                  </button>
                );
              })}
            </div>
          )}
          {errors.categoryId ? <p className="text-sm text-expense">{errors.categoryId}</p> : null}
        </fieldset>

        <div className="space-y-1.5">
          <Label htmlFor="tx-date">Дата</Label>
          <Input
            id="tx-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={errors.date ? true : undefined}
          />
          {errors.date ? <p className="text-sm text-expense">{errors.date}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tx-note">Заметка</Label>
          <Input
            id="tx-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder="Необязательно"
            aria-invalid={errors.note ? true : undefined}
          />
          {errors.note ? <p className="text-sm text-expense">{errors.note}</p> : null}
        </div>

        {formError ? (
          <p role="alert" className="text-sm text-expense">
            {formError}
          </p>
        ) : null}
      </div>

      <div className="flex gap-2 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button type="button" variant="outline" className="flex-1" onClick={onDone} disabled={pending}>
          Отмена
        </Button>
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? "Сохранение…" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
