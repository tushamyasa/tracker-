interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateResult {
  ok: boolean;
  remaining: number;
  /** Через сколько секунд окно сбросится (для повторной попытки). */
  retryAfterSec: number;
}

/**
 * Простой лимитер «фиксированное окно» в памяти процесса.
 * Защищает от массового перебора и создания аккаунтов; при нескольких
 * экземплярах приложения лимит действует на каждый экземпляр отдельно.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateResult {
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    // Не даём карте расти бесконечно: чистим протухшие записи.
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (now >= v.resetAt) buckets.delete(k);
    }
    return { ok: true, remaining: limit - 1, retryAfterSec: Math.ceil(windowMs / 1000) };
  }
  b.count += 1;
  return {
    ok: b.count <= limit,
    remaining: Math.max(0, limit - b.count),
    retryAfterSec: Math.ceil((b.resetAt - now) / 1000),
  };
}

export function resetRateLimits() {
  buckets.clear();
}
