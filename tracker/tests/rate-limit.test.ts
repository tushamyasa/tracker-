import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { rateLimit } from "@/server/rate-limit";

// Интеграционный тест: реальная Prisma и PostgreSQL (PGlite) из globalSetup.
afterAll(async () => {
  await db.$disconnect();
});

const uniq = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

describe("rateLimit (PostgreSQL)", () => {
  it("пропускает до лимита и блокирует сверх него", async () => {
    const key = uniq("a");
    const t = new Date("2026-01-01T10:00:00Z");
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await rateLimit(key, 3, 60_000, t));
    expect(results.map((r) => r.ok)).toEqual([true, true, true, false]);
    expect(results[0].remaining).toBe(2);
    expect(results[3].remaining).toBe(0);
  });

  it("лимит считается отдельно по ключам", async () => {
    const a = uniq("a");
    const b = uniq("b");
    const t = new Date("2026-01-01T10:00:00Z");
    for (let i = 0; i < 3; i++) await rateLimit(a, 3, 60_000, t);
    expect((await rateLimit(a, 3, 60_000, t)).ok).toBe(false);
    expect((await rateLimit(b, 3, 60_000, t)).ok).toBe(true);
  });

  it("после окончания окна счётчик сбрасывается", async () => {
    const key = uniq("w");
    const t = new Date("2026-01-01T10:00:00Z");
    for (let i = 0; i < 5; i++) await rateLimit(key, 3, 60_000, t);
    expect((await rateLimit(key, 3, 60_000, new Date(t.getTime() + 61_000))).ok).toBe(true);
  });

  it("сообщает, через сколько секунд повторить", async () => {
    const key = uniq("r");
    const t = new Date("2026-01-01T10:00:00Z");
    await rateLimit(key, 1, 60_000, t);
    const r = await rateLimit(key, 1, 60_000, new Date(t.getTime() + 10_000));
    expect(r.ok).toBe(false);
    expect(r.retryAfterSec).toBe(50);
  });

  it("при параллельных запросах счётчик атомарен: ровно limit запросов проходят", async () => {
    const key = uniq("p");
    const results = await Promise.all(Array.from({ length: 20 }, () => rateLimit(key, 5, 60_000)));
    expect(results.filter((r) => r.ok)).toHaveLength(5);
    expect(results.filter((r) => !r.ok)).toHaveLength(15);
  });
});
