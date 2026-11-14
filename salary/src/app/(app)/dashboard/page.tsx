import type { Metadata } from "next";
import { Suspense } from "react";
import { ExpenseDonut } from "@/components/dashboard/expense-donut";
import { MonthlyChart } from "@/components/dashboard/monthly-chart";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { AllTransactionsLink, RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/db/client";
import { parsePeriod } from "@/lib/period";
import { getUserCurrency } from "@/server/account";
import { getDashboardData } from "@/server/dashboard";
import { requireUserId } from "@/server/session";

export const metadata: Metadata = { title: "Дашборд — Salary" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}

async function DashboardContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const userId = await requireUserId();
  const period = parsePeriod({ month: first(sp.month), year: first(sp.year) });
  const [data, currency] = await Promise.all([
    getDashboardData(db, userId, period),
    getUserCurrency(db, userId),
  ]);

  return (
    <div className="space-y-4">
      <PeriodSelector period={period} />
      <SummaryCards
        summary={data.summary}
        previous={data.previous}
        compareLabel={period.compareLabel}
        currency={currency}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="rounded-lg border bg-card p-4 lg:col-span-3">
          <h2 className="mb-3 text-sm font-semibold">Динамика по месяцам</h2>
          <MonthlyChart series={data.series} currency={currency} />
        </section>
        <section className="rounded-lg border bg-card p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">Расходы по категориям</h2>
          <ExpenseDonut slices={data.byCategory} currency={currency} />
        </section>
      </div>

      <section className="rounded-lg border bg-card p-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Последние операции</h2>
          <AllTransactionsLink />
        </div>
        <RecentTransactions rows={data.recent} currency={currency} />
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Skeleton className="h-80 lg:col-span-3" />
        <Skeleton className="h-80 lg:col-span-2" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
