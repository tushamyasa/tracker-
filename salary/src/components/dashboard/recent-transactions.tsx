import Link from "next/link";
import { CategoryBadge } from "@/components/categories/category-icon";
import { formatDateRu } from "@/lib/dates";
import { formatSigned } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { TransactionRow } from "@/server/transactions";

export function RecentTransactions({ rows, currency }: { rows: TransactionRow[]; currency: string }) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Операций пока нет.</p>;
  }
  return (
    <ul className="divide-y">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-3 py-2.5">
          <CategoryBadge icon={r.categoryIcon} color={r.categoryColor} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{r.categoryName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {formatDateRu(r.date)}
              {r.note ? ` · ${r.note}` : ""}
            </p>
          </div>
          <span
            className={cn(
              "tabular text-sm font-medium whitespace-nowrap",
              r.type === "income" ? "text-income" : "text-expense",
            )}
          >
            {formatSigned(r.amount, r.type, currency)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function AllTransactionsLink() {
  return (
    <Link href="/transactions" className="text-sm font-medium text-primary hover:underline">
      Все операции
    </Link>
  );
}
