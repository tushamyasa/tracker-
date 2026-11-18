"use client";

import * as React from "react";
import { animate, useReducedMotion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { usePrivacy } from "./privacy";

/** Сумма, плавно нарастающая от нуля при загрузке. Учитывает режим приватности и prefers-reduced-motion. */
export function AnimatedMoney({
  value,
  currency,
  className,
}: {
  value: number;
  currency: string;
  className?: string;
}) {
  const { hidden } = usePrivacy();
  const reduce = useReducedMotion();
  const [text, setText] = React.useState(() => formatCurrency(value, currency));

  React.useEffect(() => {
    if (reduce) return setText(formatCurrency(value, currency));
    const controls = animate(0, value, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (v) => {
        // Копейки показываем только в финале, чтобы цифры не «дрожали»
        setText(formatCurrency(Math.abs(v - value) < 0.005 ? value : Math.round(v), currency));
      },
    });
    return () => controls.stop();
  }, [value, currency, reduce]);

  return (
    <span className={className} data-hidden={hidden} aria-label={hidden ? "Сумма скрыта" : undefined}>
      {hidden ? "••••••" : text}
    </span>
  );
}
