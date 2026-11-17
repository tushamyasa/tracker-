"use client";

import { Minus, Plus, SkipForward } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/units";

/** Плавающий таймер отдыха. endAt — момент окончания в мс, null — таймер не идёт. */
export function RestTimer({
  endAt,
  onAdjust,
  onStop,
}: {
  endAt: number | null;
  onAdjust: (deltaSec: number) => void;
  onStop: () => void;
}) {
  const t = useTranslations("workout");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [endAt]);

  const remaining = endAt === null ? 0 : Math.ceil((endAt - now) / 1000);
  const finished = endAt !== null && remaining <= 0;

  useEffect(() => {
    if (!finished) return;
    // Вибрация по окончании отдыха (где поддерживается), затем плашка скрывается.
    if (typeof navigator !== "undefined") navigator.vibrate?.([200, 100, 200]);
    const id = setTimeout(onStop, 3000);
    return () => clearTimeout(id);
  }, [finished, onStop]);

  if (endAt === null) return null;

  const btn = "grid size-11 place-items-center rounded-control bg-white/15 hover:bg-white/25";
  return (
    <div
      role="timer"
      aria-label={t("rest")}
      className="fixed inset-x-4 bottom-[88px] z-40 mx-auto flex max-w-md items-center justify-between gap-2 rounded-card bg-accent p-2 pl-4 text-white shadow-lg lg:bottom-6 lg:left-[calc(15rem+1rem)] lg:mx-0"
    >
      <div>
        <div className="text-xs opacity-80">{finished ? t("restOver") : t("rest")}</div>
        <div data-testid="rest-remaining" className="font-heading text-2xl font-extrabold">
          {formatDuration(remaining)}
        </div>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          className={btn}
          aria-label={t("restMinus")}
          onClick={() => onAdjust(-15)}
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          className={btn}
          aria-label={t("restPlus")}
          onClick={() => onAdjust(15)}
        >
          <Plus className="size-4" aria-hidden />
        </button>
        <button type="button" className={btn} aria-label={t("restSkip")} onClick={onStop}>
          <SkipForward className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
