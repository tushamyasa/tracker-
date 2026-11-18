"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import type { CategoryOption, TransactionRow } from "@/actions/transactions";
import { Dialog } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { cn } from "@/lib/utils";

type Open = (tx?: TransactionRow) => void;
const QuickAddContext = React.createContext<Open>(() => {});

/** Открывает форму операции: без аргумента — новая, с операцией — редактирование. */
export const useTransactionForm = () => React.useContext(QuickAddContext);

export function QuickAddProvider({
  categories,
  children,
}: {
  categories: CategoryOption[];
  children: React.ReactNode;
}) {
  const [state, setState] = React.useState<{ open: boolean; tx?: TransactionRow; key: number }>({
    open: false,
    key: 0,
  });
  const open = React.useCallback<Open>((tx) => setState((s) => ({ open: true, tx, key: s.key + 1 })), []);
  const close = () => setState((s) => ({ ...s, open: false }));

  return (
    <QuickAddContext.Provider value={open}>
      {children}
      <Dialog open={state.open} onClose={close} title={state.tx ? "Редактирование операции" : "Новая операция"}>
        {state.open && <TransactionForm key={state.key} categories={categories} transaction={state.tx} onDone={close} />}
      </Dialog>
    </QuickAddContext.Provider>
  );
}

export function QuickAddButton({ className }: { className?: string }) {
  const open = useTransactionForm();
  return (
    <button
      onClick={() => open()}
      aria-label="Добавить операцию"
      className={cn(
        "flex items-center justify-center rounded-md bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-colors hover:bg-emerald-400",
        className,
      )}
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}
