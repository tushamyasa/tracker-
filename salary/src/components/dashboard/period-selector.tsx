import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import type { Period } from "@/lib/period";
import { cn } from "@/lib/utils";

/** Навигация по периодам — обычные ссылки (состояние в URL, JS не нужен). */
export function PeriodSelector({ period, basePath = "/dashboard" }: { period: Period; basePath?: string }) {
  const href = (q: string) => `${basePath}?${q}`;
  const arrow = buttonVariants({ variant: "outline", size: "icon" });
  const switchTo = period.kind === "month" ? `year=${period.year}` : `month=${period.year}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Link href={href(period.prevQuery)} aria-label="Предыдущий период" className={arrow}>
          <ChevronLeft className="size-4" />
        </Link>
        <h2 className="min-w-36 text-center text-base font-semibold">{period.label}</h2>
        {period.hasNext ? (
          <Link href={href(period.nextQuery)} aria-label="Следующий период" className={arrow}>
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span aria-hidden className={cn(arrow, "pointer-events-none opacity-40")}>
            <ChevronRight className="size-4" />
          </span>
        )}
      </div>

      <div className="inline-flex rounded-lg border bg-surface p-1 text-sm font-medium">
        <Link
          href={period.kind === "month" ? "#" : href(switchTo)}
          aria-current={period.kind === "month" ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1",
            period.kind === "month" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Месяц
        </Link>
        <Link
          href={period.kind === "year" ? "#" : href(switchTo)}
          aria-current={period.kind === "year" ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1",
            period.kind === "year" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Год
        </Link>
      </div>
    </div>
  );
}
