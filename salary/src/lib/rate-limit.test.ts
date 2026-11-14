import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("пропускает до лимита и блокирует дальше", () => {
    const t = 0;
    const rl = createRateLimiter({ limit: 3, windowMs: 1000, now: () => t });
    expect(rl.check("k").ok).toBe(true);
    expect(rl.check("k").ok).toBe(true);
    const third = rl.check("k");
    expect(third.ok).toBe(true);
    expect(third.remaining).toBe(0);
    const blocked = rl.check("k");
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThanOrEqual(1);
  });

  it("освобождается после окна", () => {
    let t = 0;
    const rl = createRateLimiter({ limit: 1, windowMs: 1000, now: () => t });
    expect(rl.check("k").ok).toBe(true);
    expect(rl.check("k").ok).toBe(false);
    t = 1001;
    expect(rl.check("k").ok).toBe(true);
  });

  it("ключи независимы, reset очищает", () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 1000, now: () => 0 });
    expect(rl.check("a").ok).toBe(true);
    expect(rl.check("b").ok).toBe(true);
    expect(rl.check("a").ok).toBe(false);
    rl.reset("a");
    expect(rl.check("a").ok).toBe(true);
  });
});
