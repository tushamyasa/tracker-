"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { TransactionForm, type EditableTransaction } from "@/components/transactions/transaction-form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";

type QuickAddContextValue = {
  /** Открыть drawer: без аргумента — новая операция, с аргументом — редактирование. */
  open: (tx?: EditableTransaction) => void;
};

const QuickAddContext = createContext<QuickAddContextValue | null>(null);

export function useQuickAdd(): QuickAddContextValue {
  const ctx = useContext(QuickAddContext);
  if (!ctx) throw new Error("useQuickAdd должен использоваться внутри <QuickAddProvider>");
  return ctx;
}

type DrawerState = { isOpen: boolean; tx: EditableTransaction | null; nonce: number };

/**
 * Drawer операции: справа на десктопе, снизу (bottom-sheet) на телефоне.
 * Один экземпляр на всё приложение; открывается кнопками «+» и из списка операций.
 */
export function QuickAddProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DrawerState>({ isOpen: false, tx: null, nonce: 0 });
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const open = useCallback(
    (tx?: EditableTransaction) =>
      setState((s) => ({ isOpen: true, tx: tx ?? null, nonce: s.nonce + 1 })),
    [],
  );
  const close = useCallback(() => setState((s) => ({ ...s, isOpen: false })), []);
  const value = useMemo(() => ({ open }), [open]);

  return (
    <QuickAddContext value={value}>
      {children}
      <Sheet open={state.isOpen} onOpenChange={(o) => !o && close()}>
        <SheetContent
          side={isDesktop ? "right" : "bottom"}
          className="data-[side=right]:w-full data-[side=right]:sm:max-w-[420px] data-[side=bottom]:max-h-[92dvh] data-[side=bottom]:rounded-t-xl"
        >
          <SheetHeader>
            <SheetTitle>{state.tx ? "Редактировать операцию" : "Новая операция"}</SheetTitle>
            <SheetDescription className="sr-only">
              Тип, сумма, категория, дата и заметка
            </SheetDescription>
          </SheetHeader>
          {state.isOpen ? <TransactionForm key={state.nonce} tx={state.tx} onDone={close} /> : null}
        </SheetContent>
      </Sheet>
    </QuickAddContext>
  );
}
