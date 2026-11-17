"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ChartDatum {
  at: number;
  value: number;
  isPR: boolean;
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: ChartDatum;
}

/** Линейный график прогресса; точки-рекорды золотые. Цвета берутся из CSS-переменных темы. */
export function ProgressChart({
  data,
  locale,
  unit,
  timeZone,
}: {
  data: ChartDatum[];
  locale: string;
  unit: string;
  /** Часовой пояс подписей оси; для дат без времени (замеры) — UTC. */
  timeZone?: string;
}) {
  const fmtDate = (ms: number) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone }).format(ms);

  return (
    <div className="h-64 w-full" data-testid="progress-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="at"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={fmtDate}
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            stroke="var(--border)"
          />
          <YAxis
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            stroke="var(--border)"
            width={48}
            domain={["auto", "auto"]}
          />
          <Tooltip
            labelFormatter={(ms) => fmtDate(Number(ms))}
            formatter={(value) => [`${value} ${unit}`, ""]}
            separator=""
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--text)",
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--accent)"
            strokeWidth={2.5}
            isAnimationActive={false}
            dot={(raw) => {
              // Recharts передаёт расширенный набор свойств; нам нужны только координаты и данные точки.
              const { cx, cy, payload } = raw as unknown as DotProps;
              const key = `${cx}-${cy}`;
              if (cx === undefined || cy === undefined) return <g key={key} />;
              return payload?.isPR ? (
                <circle
                  key={key}
                  cx={cx}
                  cy={cy}
                  r={6}
                  fill="var(--gold)"
                  stroke="var(--bg)"
                  strokeWidth={2}
                />
              ) : (
                <circle key={key} cx={cx} cy={cy} r={3.5} fill="var(--accent)" />
              );
            }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
