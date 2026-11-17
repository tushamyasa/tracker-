"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Числовое поле, в котором можно набирать "7." или пустую строку:
 * внешнее значение подтягивается, только пока поле не в фокусе.
 */
export function NumInput({
  value,
  onCommit,
  label,
  decimal = false,
  max = 99999,
}: {
  value: number;
  onCommit: (n: number) => void;
  label: string;
  decimal?: boolean;
  max?: number;
}) {
  const [text, setText] = useState(value ? String(value) : "");
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(value ? String(value) : "");
  }, [value]);

  return (
    <input
      aria-label={label}
      inputMode={decimal ? "decimal" : "numeric"}
      value={text}
      placeholder="0"
      onFocus={(e) => {
        focused.current = true;
        e.currentTarget.select();
      }}
      onBlur={() => {
        focused.current = false;
        setText(value ? String(value) : "");
      }}
      onChange={(e) => {
        const raw = e.target.value.replace(",", ".");
        const pattern = decimal ? /^\d*\.?\d*$/ : /^\d*$/;
        if (!pattern.test(raw)) return;
        setText(raw);
        const n = raw === "" || raw === "." ? 0 : Math.min(max, parseFloat(raw));
        onCommit(Number.isNaN(n) ? 0 : n);
      }}
      className="h-11 w-full min-w-0 rounded-control bg-surface-2 px-2 text-center font-heading text-lg font-bold"
    />
  );
}
