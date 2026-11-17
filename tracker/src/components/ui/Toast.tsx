"use client";

import clsx from "clsx";
import { createContext, useCallback, useContext, useState } from "react";

type Kind = "info" | "success" | "error";
interface ToastItem {
  id: number;
  text: string;
  kind: Kind;
}

const ToastContext = createContext<(text: string, kind?: Kind) => void>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((text: string, kind: Kind = "info") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, text, kind }]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6"
      >
        {items.map((i) => (
          <div
            key={i.id}
            className={clsx(
              "pointer-events-auto rounded-control px-4 py-3 text-sm font-medium text-white shadow-lg",
              i.kind === "success" && "bg-[#15803d]",
              i.kind === "error" && "bg-[#dc2626]",
              i.kind === "info" && "bg-accent",
            )}
          >
            {i.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
