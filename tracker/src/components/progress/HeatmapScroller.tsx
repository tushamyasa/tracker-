"use client";

import { useEffect, useRef } from "react";

/** Контейнер с горизонтальной прокруткой, открытый на самых свежих неделях. */
export function HeatmapScroller({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);
  return (
    <div ref={ref} className="overflow-x-auto pb-2">
      {children}
    </div>
  );
}
