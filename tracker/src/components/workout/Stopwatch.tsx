"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/units";

/** Секундомер тренировки: считается от startedAt, поэтому переживает перезагрузку страницы. */
export function Stopwatch({ startedAt }: { startedAt: string }) {
  const start = new Date(startedAt).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span data-testid="stopwatch" className="font-heading text-xl font-extrabold tabular-nums">
      {now === null ? "0:00" : formatDuration((now - start) / 1000)}
    </span>
  );
}
