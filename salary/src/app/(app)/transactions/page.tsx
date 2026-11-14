import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionsList } from "@/components/transactions/transactions-list";
import { db } from "@/db/client";
import { transactionFiltersSchema } from "@/lib/validators/transaction";
import { getUserCurrency } from "@/server/account";
import { requireUserId } from "@/server/session";
import { listFormCategories, listTransactions } from "@/server/transactions";

export const metadata: Metadata = { title: "Операции — Salary" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function TransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<TransactionsSkeleton />}>
      <TransactionsContent searchParams={searchParams} />
    </Suspense>
  );
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function TransactionsContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const userId = await requireUserId();

  const filters = transactionFiltersSchema.parse({
    from: first(sp.from),
    to: first(sp.to),
    type: first(sp.type),
    categoryId: first(sp.category),
    q: first(sp.q),
    page: first(sp.page),
  });

  const [data, categories, currency] = await Promise.all([
    listTransactions(db, userId, filters),
    listFormCategories(db, userId),
    getUserCurrency(db, userId),
  ]);

  const hasFilters = Boolean(filters.from || filters.to || filters.type || filters.categoryId || filters.q);

  // тот же набор фильтров, но без пагинации
  const exportParams = new URLSearchParams();
  if (filters.from) exportParams.set("from", filters.from);
  if (filters.to) exportParams.set("to", filters.to);
  if (filters.type) exportParams.set("type", filters.type);
  if (filters.categoryId) exportParams.set("category", filters.categoryId);
  if (filters.q) exportParams.set("q", filters.q);
  const qs = exportParams.toString();

  return (
    <div className="space-y-4">
      <TransactionFilters categories={categories} />
      <TransactionsList
        data={data}
        hasFilters={hasFilters}
        currency={currency}
        exportHref={`/api/export/csv${qs ? `?${qs}` : ""}`}
      />
    </div>
  );
}

function TransactionsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-full" />
      <div className="space-y-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
