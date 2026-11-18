import { getDashboardData } from "@/actions/dashboard";
import { getUserCurrency } from "@/actions/transactions";
import { ExpenseDonut, MonthlyBars } from "@/components/dashboard/charts";
import { Hero, MonthNav } from "@/components/dashboard/hero";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { RecentTransactions } from "@/components/dashboard/recent";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const m = Array.isArray(sp.m) ? sp.m[0] : sp.m;
  const [data, currency] = await Promise.all([getDashboardData(m), getUserCurrency()]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Дашборд</h1>
        <MonthNav year={data.year} month={data.month} isCurrent={data.isCurrentMonth} />
      </div>

      <Hero
        balance={data.balance}
        net={data.income - data.expense}
        prevNet={data.prevIncome - data.prevExpense}
        currency={currency}
      />
      <KpiCards
        income={data.income}
        expense={data.expense}
        prevIncome={data.prevIncome}
        prevExpense={data.prevExpense}
        currency={currency}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ExpenseDonut data={data.byCategory} currency={currency} />
        <MonthlyBars data={data.monthly} currency={currency} />
      </div>

      <RecentTransactions rows={data.recent} currency={currency} />
    </div>
  );
}
