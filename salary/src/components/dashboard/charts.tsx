"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { usePrivacy } from "./privacy";

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 6,
  fontSize: 12,
  color: "hsl(var(--popover-foreground))",
};

export function ExpenseDonut({
  data,
  currency,
}: {
  data: { name: string; color: string; value: number }[];
  currency: string;
}) {
  const { hidden } = usePrivacy();
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="min-w-0 p-4">
      <h2 className="mb-3 text-base font-semibold">Расходы по категориям</h2>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Нет расходов за этот месяц</p>
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="donut relative h-48 w-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={2} stroke="none">
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                {!hidden && (
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                    formatter={(v) => formatCurrency(Number(v), currency)}
                  />
                )}
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-muted-foreground">Всего</span>
              <span className="num text-sm font-semibold">{hidden ? "••••••" : formatCurrency(total, currency)}</span>
            </div>
          </div>
          <ul className="w-full min-w-0 flex-1 space-y-2">
            {data.slice(0, 6).map((d) => (
              <li key={d.name} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: d.color }} />
                <span className="min-w-0 flex-1 truncate">{d.name}</span>
                <span className="num text-xs text-muted-foreground">{Math.round((d.value / total) * 100)}%</span>
                <span className="num w-24 text-right text-xs font-medium">
                  {hidden ? "••••••" : formatCurrency(d.value, currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

export function MonthlyBars({
  data,
  currency,
}: {
  data: { label: string; income: number; expense: number }[];
  currency: string;
}) {
  const { hidden } = usePrivacy();
  const empty = data.every((d) => d.income === 0 && d.expense === 0);

  return (
    <Card className="min-w-0 p-4">
      <h2 className="mb-3 text-base font-semibold">Доходы и расходы по месяцам</h2>
      {empty ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Пока нет данных</p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <YAxis
                hide={hidden}
                width={48}
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
              />
              {!hidden && (
                <Tooltip
                  cursor={{ fill: "hsl(var(--foreground) / 0.05)" }}
                  contentStyle={tooltipStyle}
                  formatter={(v, name) => [formatCurrency(Number(v), currency), name === "income" ? "Доходы" : "Расходы"]}
                />
              )}
              <Bar dataKey="income" fill="#10B981" radius={[2, 2, 0, 0]} />
              <Bar dataKey="expense" fill="#EF4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
