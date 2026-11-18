import { afterAll, describe, expect, it } from "vitest";

/** Интеграционный тест: реальная Prisma и PostgreSQL (PGlite) из globalSetup, реальные миграции. */
import { db } from "@/lib/db";
import * as tokens from "@/server/auth/login-token";

afterAll(async () => {
  await db.$disconnect();
});

describe("токены входа", () => {
  it("токен создаётся и погашается один раз, возвращая email", async () => {
    const raw = await tokens.createLoginToken("a@example.com");
    expect(raw.length).toBeGreaterThanOrEqual(40);
    expect(await tokens.peekLoginToken(raw)).toBe(true);
    expect(await tokens.consumeLoginToken(raw)).toBe("a@example.com");
    expect(await tokens.consumeLoginToken(raw)).toBeNull(); // повторное использование
    expect(await tokens.peekLoginToken(raw)).toBe(false);
  });

  it("в базе лежит только хеш, а не сам токен", async () => {
    const raw = await tokens.createLoginToken("hash@example.com");
    const rows = await db.loginToken.findMany({ where: { email: "hash@example.com" } });
    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).toBe(tokens.hashToken(raw));
    expect(rows[0].tokenHash).not.toContain(raw);
  });

  it("просроченный токен не принимается", async () => {
    const now = new Date("2026-01-01T10:00:00Z");
    const raw = await tokens.createLoginToken("late@example.com", now);
    const in14 = new Date(now.getTime() + 14 * 60_000);
    const in16 = new Date(now.getTime() + 16 * 60_000);
    expect(await tokens.peekLoginToken(raw, in14)).toBe(true);
    expect(await tokens.consumeLoginToken(raw, in16)).toBeNull();
    expect(await tokens.peekLoginToken(raw, in16)).toBe(false);
  });

  it("подделанный или короткий токен отвергается", async () => {
    const raw = await tokens.createLoginToken("forge@example.com");
    const forged = raw.slice(0, -1) + (raw.endsWith("A") ? "B" : "A");
    expect(await tokens.consumeLoginToken(forged)).toBeNull();
    expect(await tokens.consumeLoginToken("short")).toBeNull();
    expect(await tokens.consumeLoginToken("")).toBeNull();
    expect(await tokens.consumeLoginToken("'; DROP TABLE LoginToken; --")).toBeNull();
    expect(await tokens.consumeLoginToken(raw)).toBe("forge@example.com"); // настоящий всё ещё работает
  });

  it("при параллельном погашении успешен ровно один запрос", async () => {
    const raw = await tokens.createLoginToken("race@example.com");
    const results = await Promise.all(
      Array.from({ length: 8 }, () => tokens.consumeLoginToken(raw)),
    );
    expect(results.filter((r) => r === "race@example.com")).toHaveLength(1);
    expect(results.filter((r) => r === null)).toHaveLength(7);
  });

  it("токены разных адресов независимы", async () => {
    const a = await tokens.createLoginToken("one@example.com");
    const b = await tokens.createLoginToken("two@example.com");
    expect(await tokens.consumeLoginToken(b)).toBe("two@example.com");
    expect(await tokens.consumeLoginToken(a)).toBe("one@example.com");
  });

  it("при создании нового токена старые просроченные и использованные удаляются", async () => {
    const old = new Date("2020-01-01T00:00:00Z");
    await tokens.createLoginToken("clean@example.com", old);
    await tokens.createLoginToken("trigger@example.com");
    const left = await db.loginToken.findMany({ where: { email: "clean@example.com" } });
    expect(left).toHaveLength(0);
  });
});
