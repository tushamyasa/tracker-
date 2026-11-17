export type AuthMode = "open" | "email";

/**
 * open  — вход по любому email без подтверждения (демо и личное использование);
 * email — вход по одноразовой ссылке из письма, владение почтой подтверждается.
 */
export function authMode(env: Record<string, string | undefined> = process.env): AuthMode {
  return env.AUTH_MODE === "email" ? "email" : "open";
}

export const LOGIN_TOKEN_TTL_MS = 15 * 60 * 1000;

/** Публичный адрес приложения без завершающего слэша; нужен для ссылок в письмах. */
export function appUrl(env: Record<string, string | undefined> = process.env): string | null {
  const raw = env.APP_URL?.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.origin;
  } catch {
    return null;
  }
}
