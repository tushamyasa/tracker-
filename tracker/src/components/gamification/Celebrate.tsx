"use client";

import { useEffect } from "react";
import { fireConfetti } from "@/lib/confetti";

/** Запускает конфетти один раз при показе, если эффекты включены. */
export function Celebrate({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (enabled) void fireConfetti();
  }, [enabled]);
  return null;
}
