"use client";

import { Minus, Plus } from "lucide-react";

export interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  label: string;
  unit?: string;
}

export function NumberStepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  label,
  unit,
}: NumberStepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n * 100) / 100));
  const btn =
    "grid size-11 place-items-center rounded-control bg-surface-2 text-text hover:bg-border disabled:opacity-40";
  return (
    <div role="group" aria-label={label} className="flex items-center gap-2">
      <button
        type="button"
        className={btn}
        aria-label={`${label} −`}
        disabled={value <= min}
        onClick={() => onChange(clamp(value - step))}
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <div className="flex min-w-20 items-baseline justify-center gap-1">
        <input
          inputMode="decimal"
          aria-label={label}
          value={value}
          onChange={(e) => {
            const n = parseFloat(e.target.value.replace(",", "."));
            onChange(Number.isNaN(n) ? min : clamp(n));
          }}
          className="w-16 bg-transparent text-center font-heading text-2xl font-extrabold"
        />
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </div>
      <button
        type="button"
        className={btn}
        aria-label={`${label} +`}
        disabled={value >= max}
        onClick={() => onChange(clamp(value + step))}
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
