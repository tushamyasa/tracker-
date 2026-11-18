"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const KEY = "salary:hide-amounts";
const PrivacyContext = React.createContext<{ hidden: boolean; toggle: () => void }>({
  hidden: true,
  toggle: () => {},
});

export const usePrivacy = () => React.useContext(PrivacyContext);

/** Режим приватности: до чтения настройки суммы скрыты, чтобы не мелькнуть на экране. */
export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = React.useState(true);

  React.useEffect(() => {
    try {
      setHidden(localStorage.getItem(KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, []);

  const toggle = React.useCallback(() => {
    setHidden((h) => {
      try {
        localStorage.setItem(KEY, h ? "0" : "1");
      } catch {}
      return !h;
    });
  }, []);

  return <PrivacyContext.Provider value={{ hidden, toggle }}>{children}</PrivacyContext.Provider>;
}

export function Money({
  value,
  currency,
  signed = false,
  className,
}: {
  value: number;
  currency: string;
  signed?: boolean;
  className?: string;
}) {
  const { hidden } = usePrivacy();
  const sign = signed ? (value > 0 ? "+" : value < 0 ? "−" : "") : "";
  return (
    <span className={className} data-hidden={hidden}>
      {hidden ? "••••••" : sign + formatCurrency(signed ? Math.abs(value) : value, currency)}
    </span>
  );
}

export function PrivacyToggle() {
  const { hidden, toggle } = usePrivacy();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-pressed={hidden}
      aria-label={hidden ? "Показать суммы" : "Скрыть суммы"}
      title={hidden ? "Показать суммы" : "Скрыть суммы"}
    >
      {hidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </Button>
  );
}
