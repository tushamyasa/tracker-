import "server-only";
import { db } from "@/lib/db";

export interface RateResult {
  ok: boolean;
  remaining: number;
  /** Через сколько секунд окно сбросится (для повторной попытки). */
  retryAfterSec: number;
}

/**
 * Ограничение частоты «фиксированное окно» с хранением в PostgreSQL.
 * Счётчик увеличивается одним атомарным оператором INSERT ... ON CONFLICT DO UPDATE,
 * поэтому параллельные запросы (в том числе с разных экземпляров приложения) считаются верно.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: Date = new Date(),
): Promise<RateResult> {
  const resetAt = new Date(now.getTime() + windowMs);
  const rows = await db.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN ${resetAt} ELSE "RateLimit"."resetAt" END
    RETURNING "count", "resetAt"`;
  const { count, resetAt: until } = rows[0];

  // Изредка чистим протухшие записи, чтобы таблица не росла.
  if (Math.random() < 0.02) {
    void db.rateLimit.deleteMany({ where: { resetAt: { lt: now } } }).catch(() => {});
  }

  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSec: Math.max(0, Math.ceil((until.getTime() - now.getTime()) / 1000)),
  };
}
