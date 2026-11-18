"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/** Модальное окно на нативном <dialog>: десктоп — по центру, мобильные — шторка снизу. */
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cn(
        "m-0 w-full max-w-md rounded-md border border-border bg-popover p-0 text-foreground shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm",
        "fixed bottom-0 top-auto max-md:max-w-none max-md:rounded-b-none md:inset-0 md:m-auto",
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <button onClick={onClose} aria-label="Закрыть" className="rounded-md p-1 hover:bg-foreground/10">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </dialog>
  );
}
