import { auth } from "@/auth";
import { db } from "@/db/client";
import { todayString } from "@/lib/dates";
import { transactionFiltersSchema } from "@/lib/validators/transaction";
import { getUserCurrency } from "@/server/account";
import { transactionsToCsv } from "@/server/csv";
import { listTransactions } from "@/server/transactions";

const MAX_ROWS = 50_000;

/**
 * Экспорт операций пользователя в CSV по тем же фильтрам, что и список
 * (?from=&to=&type=&category=&q=). /api не покрыт proxy, поэтому сессия
 * проверяется здесь.
 */
export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const sp = new URL(request.url).searchParams;
  const filters = transactionFiltersSchema.parse({
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    type: sp.get("type") ?? undefined,
    categoryId: sp.get("category") ?? undefined,
    q: sp.get("q") ?? undefined,
    page: 1,
  });

  const [{ rows }, currency] = await Promise.all([
    listTransactions(db, userId, filters, MAX_ROWS),
    getUserCurrency(db, userId),
  ]);

  return new Response(transactionsToCsv(rows, currency), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="salary-${todayString()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
