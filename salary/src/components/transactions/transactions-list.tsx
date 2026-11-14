"use client";

import { ChevronLeft, ChevronRight, Download, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CategoryBadge } from "@/components/categories/category-icon";
import { useQuickAdd } from "@/components/layout/quick-add";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateRu } from "@/lib/dates";
import { formatMoney, formatSigned } from "@/lib/money";
import { cn } from "@/lib/utils";
import { deleteTransactionAction } from "@/server/actions/transactions";
import type { TransactionList, TransactionRow } from "@/server/transactions";
import type { EditableTransaction } from "./transaction-form";

function toEditable(r: TransactionRow): EditableTransaction {
  return {
    id: r.id,
    type: r.type,
    amount: r.amount,
    categoryId: r.categoryId,
    date: r.date,
    note: r.note,
    category: {
      id: r.categoryId,
      name: r.categoryName,
      type: r.type,
      icon: r.categoryIcon,
      color: r.categoryColor,
    },
  };
}

function Amount({
  row,
  currency,
  className,
}: {
  row: TransactionRow;
  currency: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "tabular font-medium whitespace-nowrap",
        row.type === "income" ? "text-income" : "text-expense",
        className,
      )}
    >
      {formatSigned(row.amount, row.type, currency)}
    </span>
  );
}

export function TransactionsList({
  data,
  hasFilters,
  currency,
  exportHref,
}: {
  data: TransactionList;
  hasFilters: boolean;
  currency: string;
  exportHref: string;
}) {
  const { open } = useQuickAdd();
  const [toDelete, setToDelete] = useState<TransactionRow | null>(null);
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  if (data.total === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-surface px-6 py-14 text-center">
        <p className="text-sm text-muted-foreground">
          {hasFilters ? "По заданным фильтрам операций нет." : "Операций пока нет."}
        </p>
        {!hasFilters ? (
          <Button className="mt-3" onClick={() => open()}>
            Добавить первую операцию
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
        <span>Найдено: {data.total}</span>
        <span className="tabular">
          Доходы: <span className="font-medium text-income">{formatMoney(data.totals.income, currency)}</span>
        </span>
        <span className="tabular">
          Расходы: <span className="font-medium text-expense">{formatMoney(data.totals.expense, currency)}</span>
        </span>
        <a
          href={exportHref}
          download
          className="ml-auto inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
        >
          <Download className="size-4" aria-hidden />
          Экспорт CSV
        </a>
      </div>

      {/* Десктоп: таблица */}
      <div className="hidden rounded-lg border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Дата</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Заметка</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="tabular text-muted-foreground">{formatDateRu(r.date)}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <CategoryBadge icon={r.categoryIcon} color={r.categoryColor} className="size-7" />
                    {r.categoryName}
                  </span>
                </TableCell>
                <TableCell className="max-w-[24rem] truncate text-muted-foreground">{r.note}</TableCell>
                <TableCell className="text-right">
                  <Amount row={r} currency={currency} />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Редактировать операцию"
                      onClick={() => open(toEditable(r))}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Удалить операцию"
                      onClick={() => setToDelete(r)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Телефон: карточки */}
      <ul className="divide-y rounded-lg border bg-card md:hidden">
        {data.rows.map((r) => (
          <li key={r.id} className="flex items-center gap-3 px-3 py-2.5">
            <button
              type="button"
              onClick={() => open(toEditable(r))}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
              aria-label={`Редактировать: ${r.categoryName}`}
            >
              <CategoryBadge icon={r.categoryIcon} color={r.categoryColor} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{r.categoryName}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {formatDateRu(r.date)}
                  {r.note ? ` · ${r.note}` : ""}
                </span>
              </span>
              <Amount row={r} currency={currency} className="text-sm" />
            </button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Удалить операцию"
              onClick={() => setToDelete(r)}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>

      {totalPages > 1 ? <Pagination page={data.page} totalPages={totalPages} /> : null}

      <DeleteDialog row={toDelete} currency={currency} onOpenChange={(o) => !o && setToDelete(null)} />
    </div>
  );
}

function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const pathname = usePathname();
  const params = useSearchParams();

  const href = (p: number) => {
    const next = new URLSearchParams(params.toString());
    if (p <= 1) next.delete("page");
    else next.set("page", String(p));
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const linkClass = buttonVariants({ variant: "outline", size: "lg" });
  const disabledClass = cn(linkClass, "pointer-events-none opacity-50");

  return (
    <nav aria-label="Страницы" className="flex items-center justify-between pt-1">
      <Link
        href={href(page - 1)}
        aria-disabled={page <= 1}
        tabIndex={page <= 1 ? -1 : undefined}
        className={page <= 1 ? disabledClass : linkClass}
      >
        <ChevronLeft className="size-4" /> Назад
      </Link>
      <span className="text-sm text-muted-foreground">
        Стр. {page} из {totalPages}
      </span>
      <Link
        href={href(page + 1)}
        aria-disabled={page >= totalPages}
        tabIndex={page >= totalPages ? -1 : undefined}
        className={page >= totalPages ? disabledClass : linkClass}
      >
        Вперёд <ChevronRight className="size-4" />
      </Link>
    </nav>
  );
}

function DeleteDialog({
  row,
  currency,
  onOpenChange,
}: {
  row: TransactionRow | null;
  currency: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    if (!row) return;
    setError(null);
    startTransition(async () => {
      const r = await deleteTransactionAction(row.id);
      if (r.ok) {
        toast.success("Операция удалена");
        onOpenChange(false);
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <Dialog
      open={row !== null}
      onOpenChange={(o) => {
        if (!o) setError(null);
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Удалить операцию?</DialogTitle>
          <DialogDescription>
            {row
              ? `${row.categoryName} · ${formatDateRu(row.date)} · ${formatSigned(row.amount, row.type, currency)}. Действие нельзя отменить.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p role="alert" className="text-sm text-expense">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Отмена
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending ? "Удаление…" : "Удалить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
