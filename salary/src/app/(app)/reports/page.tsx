import type { Metadata } from "next";
import { Download } from "lucide-react";
import { Suspense } from "react";
import { CategoryBadge } from "@/components/categories/category-icon";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/db/client";
import type { TransactionType } from "@/db/schema";
import { formatMoney } from "@/lib/money";
import { parsePeriod } from "@/lib/period";
import { getUserCurrency } from "@/server/account";
import { getBreakdown, type BreakdownRow } from "@/server/reports";
import { requireUserId } from "@/server/session";

export const metadata: Metadata = { title: "Отчёты — Salary" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const pctFmt = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });

export default function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ReportsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ReportsContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const userId = await requireUserId();
  const period = parsePeriod({ month: first(sp.month), year: first(sp.year) });

  const [expense, income, currency] = await Promise.all([
    getBreakdown(db, userId, period.range, "expense"),
    getBreakdown(db, userId, period.range, "income"),
    getUserCurrency(db, userId),
  ]);

  const exportHref = `/api/export/csv?from=${period.range.from}&to=${period.range.to}`;

  return (
    <div className="space-y-4">
      <PeriodSelector period={period} basePath="/reports" />

      <div className="flex justify-end">
        <a href={exportHref} download className={buttonVariants({ variant: "outline", size: "lg" })}>
          <Download className="size-4" aria-hidden />
          Экспорт CSV за {period.label.toLowerCase()}
        </a>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownTable title="Расходы по категориям" type="expense" data={expense} currency={currency} />
        <BreakdownTable title="Доходы по категориям" type="income" data={income} currency={currency} />
      </div>
    </div>
  );
}

function BreakdownTable({
  title,
  type,
  data,
  currency,
}: {
  title: string;
  type: TransactionType;
  data: { rows: BreakdownRow[]; total: number };
  currency: string;
}) {
  const sign = type === "income" ? "+" : "−";
  const color = type === "income" ? "text-income" : "text-expense";

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className={`tabular text-sm font-semibold ${color}`}>
          {sign} {formatMoney(data.total, currency)}
        </span>
      </div>

      {data.rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">За период операций нет.</p>
      ) : (
        <table className="w-full text-sm">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="pb-2 font-medium">Категория</th>
              <th className="px-3 pb-2 text-right font-medium">Опер.</th>
              <th className="pb-2 text-right font-medium">Сумма</th>
              <th className="w-14 pb-2 text-right font-medium">Доля</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.rows.map((r) => (
              <tr key={r.id}>
                <td className="py-2">
                  <span className="flex items-center gap-2">
                    <CategoryBadge icon={r.icon} color={r.color} className="size-7" />
                    <span className="truncate">{r.name}</span>
                  </span>
                </td>
                <td className="tabular px-3 py-2 text-right text-muted-foreground">{r.count}</td>
                <td className="tabular py-2 text-right whitespace-nowrap">{formatMoney(r.amount, currency)}</td>
                <td className="tabular py-2 text-right font-medium">{pctFmt.format(r.percent)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
