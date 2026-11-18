import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Delta, pctChange } from "./hero";
import { Money } from "./privacy";

export function KpiCards({
  income,
  expense,
  prevIncome,
  prevExpense,
  currency,
}: {
  income: number;
  expense: number;
  prevIncome: number;
  prevExpense: number;
  currency: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card className="border-emerald-500/20 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Всего доходов</p>
          <TrendingUp className="h-6 w-6 text-emerald-500" />
        </div>
        <p className="num mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
          <Money value={income} currency={currency} />
        </p>
        <div className="mt-1">
          <Delta pct={pctChange(income, prevIncome)} goodWhenUp />
        </div>
      </Card>
      <Card className="border-rose-500/20 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Всего расходов</p>
          <TrendingDown className="h-6 w-6 text-rose-500" />
        </div>
        <p className="num mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
          <Money value={expense} currency={currency} />
        </p>
        <div className="mt-1">
          <Delta pct={pctChange(expense, prevExpense)} goodWhenUp={false} />
        </div>
      </Card>
    </div>
  );
}
