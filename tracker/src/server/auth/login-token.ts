import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { LOGIN_TOKEN_TTL_MS } from "@/lib/auth-config";

/** В базе хранится только хеш: утечка таблицы не даёт войти по чужим ссылкам. */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Создаёт одноразовый токен для email и возвращает его открытое значение (попадает только в письмо). */
export async function createLoginToken(email: string, now: Date = new Date()): Promise<string> {
  // Просроченные и использованные токены больше не нужны.
  await db.loginToken.deleteMany({
    where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] },
  });
  const raw = randomBytes(32).toString("base64url");
  await db.loginToken.create({
    data: {
      email,
      tokenHash: hashToken(raw),
      expiresAt: new Date(now.getTime() + LOGIN_TOKEN_TTL_MS),
    },
  });
  return raw;
}

/**
 * Погашает токен и возвращает email, либо null, если токен неверный, просрочен или уже использован.
 * Погашение атомарно: два одновременных запроса с одним токеном не пройдут оба.
 */
export async function consumeLoginToken(
  raw: string,
  now: Date = new Date(),
): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(raw)) return null;
  const tokenHash = hashToken(raw);
  const claimed = await db.loginToken.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
    data: { usedAt: now },
  });
  if (claimed.count !== 1) return null;
  const row = await db.loginToken.findUnique({ where: { tokenHash } });
  return row?.email ?? null;
}

/** Только проверка без погашения: для страницы подтверждения. */
export async function peekLoginToken(raw: string, now: Date = new Date()): Promise<boolean> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(raw)) return false;
  const row = await db.loginToken.findUnique({ where: { tokenHash: hashToken(raw) } });
  return !!row && !row.usedAt && row.expiresAt > now;
}
