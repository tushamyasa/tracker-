import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { monthLabel, shiftMonth, toYm } from "@/lib/month";
import { cn } from "@/lib/utils";
import { AnimatedMoney } from "./animated-number";
import { Money, PrivacyToggle } from "./privacy";

/** Изменение к прошлому месяцу в процентах; null, если сравнивать не с чем. */
export function pctChange(cur: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((cur - prev) / Math.abs(prev)) * 100;
}

export function Delta({ pct, goodWhenUp = true }: { pct: number | null; goodWhenUp?: boolean }) {
  if (pct === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3.5 w-3.5" /> нет данных за прошлый месяц
      </span>
    );
  }
  const up = pct >= 0;
  const good = up === goodWhenUp;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        good ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="num">
        {up ? "+" : "−"}
        {Math.abs(pct).toFixed(1)}%
      </span>{" "}
      к прошлому месяцу
    </span>
  );
}

export function MonthNav({ year, month, isCurrent }: { year: number; month: number; isCurrent: boolean }) {
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const link = "flex h-8 w-8 items-center justify-center rounded-md hover:bg-foreground/10";
  return (
    <div className="flex items-center gap-1">
      <Link href={`/dashboard?m=${toYm(prev.year, prev.month)}`} className={link} aria-label="Предыдущий месяц">
        <ChevronLeft className="h-4 w-4" />
      </Link>
      <span className="min-w-36 text-center text-sm font-medium">{monthLabel(year, month)}</span>
      {isCurrent ? (
        <span className={cn(link, "pointer-events-none opacity-30")} aria-hidden>
          <ChevronRight className="h-4 w-4" />
        </span>
      ) : (
        <Link href={`/dashboard?m=${toYm(next.year, next.month)}`} className={link} aria-label="Следующий месяц">
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export function Hero({
  balance,
  net,
  prevNet,
  currency,
}: {
  balance: number;
  net: number;
  prevNet: number;
  currency: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Баланс</p>
          <p className="num mt-1 text-4xl font-bold tracking-tight">
            <AnimatedMoney value={balance} currency={currency} />
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-xs text-muted-foreground">
              За месяц: <Money value={net} currency={currency} signed className="num font-medium text-foreground" />
            </span>
            <Delta pct={pctChange(net, prevNet)} />
          </div>
        </div>
        <PrivacyToggle />
      </div>
    </Card>
  );
}
