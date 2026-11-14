import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { percentChange } from "@/lib/period";
import { cn } from "@/lib/utils";
import type { Summary } from "@/server/dashboard";

function Delta({ text, direction }: { text: string; direction: "up" | "down" | "none" }) {
  const Icon = direction === "up" ? ArrowUp : direction === "down" ? ArrowDown : Minus;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className="size-3" aria-hidden />
      {text}
    </p>
  );
}

function percentDelta(cur: number, prev: number, compareLabel: string) {
  const pct = percentChange(cur, prev);
  if (pct === null) return <Delta text={cur === 0 ? "нет операций" : "нет данных для сравнения"} direction="none" />;
  return (
    <Delta
      text={`${Math.abs(pct)}% ${compareLabel}`}
      direction={pct > 0 ? "up" : pct < 0 ? "down" : "none"}
    />
  );
}

export function SummaryCards({
  summary,
  previous,
  compareLabel,
  currency,
}: {
  summary: Summary;
  previous: Summary;
  compareLabel: string;
  currency: string;
}) {
  const diff = summary.balance - previous.balance;
  const sign = diff > 0 ? "+" : diff < 0 ? "−" : "";

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Баланс</p>
        <p
          className={cn(
            "tabular mt-1 text-2xl font-semibold",
            summary.balance > 0 && "text-income",
            summary.balance < 0 && "text-expense",
          )}
        >
          {summary.balance < 0 ? "− " : ""}
          {formatMoney(Math.abs(summary.balance), currency)}
        </p>
        <Delta
          text={diff === 0 ? `без изменений ${compareLabel}` : `${sign} ${formatMoney(Math.abs(diff), currency)} ${compareLabel}`}
          direction={diff > 0 ? "up" : diff < 0 ? "down" : "none"}
        />
      </div>

      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Доходы</p>
        <p className="tabular mt-1 text-2xl font-semibold text-income">+ {formatMoney(summary.income, currency)}</p>
        {percentDelta(summary.income, previous.income, compareLabel)}
      </div>

      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Расходы</p>
        <p className="tabular mt-1 text-2xl font-semibold text-expense">
          {"−"} {formatMoney(summary.expense, currency)}
        </p>
        {percentDelta(summary.expense, previous.expense, compareLabel)}
      </div>
    </div>
  );
}
