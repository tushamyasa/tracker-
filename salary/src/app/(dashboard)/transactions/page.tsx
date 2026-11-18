import {
  getCategoryOptions,
  getTransactions,
  getUserCurrency,
} from "@/actions/transactions";
import { Filters } from "@/components/transactions/filters";
import { TransactionsView } from "@/components/transactions/transactions-view";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | undefined) => (v && Number.isFinite(Number(v)) ? Number(v) : undefined);

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const type = one(sp.type);
  const cat = one(sp.cat);

  const [categories, currency, { rows, truncated }] = await Promise.all([
    getCategoryOptions(),
    getUserCurrency(),
    getTransactions({
      type: type === "income" || type === "expense" ? type : undefined,
      from: num(one(sp.from)),
      to: num(one(sp.to)),
      categoryIds: cat ? cat.split(",").filter(Boolean) : undefined,
      q: one(sp.q) || undefined,
    }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Транзакции</h1>
      <Filters categories={categories} />
      <TransactionsView rows={rows} currency={currency} truncated={truncated} />
    </div>
  );
}
