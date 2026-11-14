"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/money";
import type { MonthPoint } from "@/server/dashboard";

const SHORT = new Intl.DateTimeFormat("ru-RU", { month: "short", timeZone: "UTC" });
const LONG = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric", timeZone: "UTC" });
const COMPACT = new Intl.NumberFormat("ru-RU", { notation: "compact", maximumFractionDigits: 1 });

const toDate = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
};

type Row = MonthPoint & { label: string };

const NAMES: Record<string, string> = { income: "Доходы", expense: "Расходы", balance: "Баланс" };

function ChartTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: { payload: Row }[];
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium capitalize">{LONG.format(toDate(row.key))}</p>
      <p className="tabular text-income">Доходы: {formatMoney(row.income, currency)}</p>
      <p className="tabular text-expense">Расходы: {formatMoney(row.expense, currency)}</p>
      <p className="tabular text-muted-foreground">
        Баланс: {row.balance < 0 ? "− " : ""}
        {formatMoney(Math.abs(row.balance), currency)}
      </p>
    </div>
  );
}

export function MonthlyChart({ series, currency }: { series: MonthPoint[]; currency: string }) {
  const data: Row[] = series.map((p) => ({ ...p, label: SHORT.format(toDate(p.key)).replace(".", "") }));
  const empty = series.every((p) => p.income === 0 && p.expense === 0);

  if (empty) {
    return (
      <p className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        За выбранный период операций нет.
      </p>
    );
  }

  return (
    <>
      <div role="img" aria-label="Диаграмма: доходы, расходы и баланс по месяцам">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
            <YAxis
              width={60}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickFormatter={(v: number) => COMPACT.format(v / 100)}
            />
            <Tooltip content={<ChartTooltip currency={currency} />} cursor={{ fill: "var(--surface-2)" }} />
            <Legend formatter={(v: string) => NAMES[v] ?? v} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="income" fill="var(--income)" radius={[3, 3, 0, 0]} maxBarSize={20} />
            <Bar dataKey="expense" fill="var(--expense)" radius={[3, 3, 0, 0]} maxBarSize={20} />
            <Line
              dataKey="balance"
              type="monotone"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "var(--primary)" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Табличная версия для скринридеров */}
      <table className="sr-only">
        <caption>Доходы, расходы и баланс по месяцам</caption>
        <thead>
          <tr>
            <th>Месяц</th>
            <th>Доходы</th>
            <th>Расходы</th>
            <th>Баланс</th>
          </tr>
        </thead>
        <tbody>
          {series.map((p) => (
            <tr key={p.key}>
              <td>{LONG.format(toDate(p.key))}</td>
              <td>{formatMoney(p.income, currency)}</td>
              <td>{formatMoney(p.expense, currency)}</td>
              <td>{formatMoney(p.balance, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
