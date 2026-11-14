/**
 * Простой in-memory rate limit (скользящее окно) для MVP.
 * В serverless состояние не общее между инстансами — для продакшена
 * с несколькими инстансами заменить на Upstash Redis (см. PLAN.md).
 */

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSec: number };

export type RateLimiter = {
  check(key: string): RateLimitResult;
  reset(key: string): void;
};

export function createRateLimiter(opts: {
  limit: number;
  windowMs: number;
  now?: () => number;
}): RateLimiter {
  const { limit, windowMs } = opts;
  const now = opts.now ?? Date.now;
  const hits = new Map<string, number[]>();

  function prune(key: string, t: number): number[] {
    const fresh = (hits.get(key) ?? []).filter((ts) => t - ts < windowMs);
    if (fresh.length) hits.set(key, fresh);
    else hits.delete(key);
    return fresh;
  }

  return {
    check(key) {
      const t = now();
      const fresh = prune(key, t);
      if (fresh.length >= limit) {
        const retryAfterSec = Math.max(1, Math.ceil((fresh[0] + windowMs - t) / 1000));
        return { ok: false, remaining: 0, retryAfterSec };
      }
      fresh.push(t);
      hits.set(key, fresh);
      return { ok: true, remaining: limit - fresh.length, retryAfterSec: 0 };
    },
    reset(key) {
      hits.delete(key);
    },
  };
}

// Общие экземпляры для Server Actions.
const g = globalThis as unknown as {
  __loginLimiter?: RateLimiter;
  __registerLimiter?: RateLimiter;
};

/** 5 попыток входа за 15 минут на пару IP+email. */
export const loginLimiter = (g.__loginLimiter ??= createRateLimiter({
  limit: 5,
  windowMs: 15 * 60 * 1000,
}));

/** 5 регистраций в час с одного IP. */
export const registerLimiter = (g.__registerLimiter ??= createRateLimiter({
  limit: 5,
  windowMs: 60 * 60 * 1000,
}));
