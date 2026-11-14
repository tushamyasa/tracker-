"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatMoney } from "@/lib/money";
import type { CategorySlice } from "@/server/dashboard";

const pctFmt = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });

function SliceTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: { payload: CategorySlice }[];
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{s.name}</p>
      <p className="tabular text-muted-foreground">
        {formatMoney(s.amount, currency)} · {pctFmt.format(s.percent)}%
      </p>
    </div>
  );
}

export function ExpenseDonut({ slices, currency }: { slices: CategorySlice[]; currency: string }) {
  if (slices.length === 0) {
    return (
      <p className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
        Расходов за период нет.
      </p>
    );
  }
  const total = slices.reduce((s, x) => s + x.amount, 0);

  return (
    <div>
      <div className="relative" role="img" aria-label="Круговая диаграмма расходов по категориям">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={slices}
              dataKey="amount"
              nameKey="name"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={slices.length > 1 ? 2 : 0}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {slices.map((s) => (
                <Cell key={s.id ?? "rest"} fill={s.color} />
              ))}
            </Pie>
            <Tooltip content={<SliceTooltip currency={currency} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Расходы</span>
          <span className="tabular text-base font-semibold">{formatMoney(total, currency)}</span>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {slices.map((s) => (
          <li key={s.id ?? "rest"} className="flex items-center gap-2 text-sm">
            <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="min-w-0 flex-1 truncate">{s.name}</span>
            <span className="tabular text-muted-foreground">{formatMoney(s.amount, currency)}</span>
            <span className="tabular w-12 text-right font-medium">{pctFmt.format(s.percent)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
