import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 дней

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error("SESSION_SECRET is not set");
  // Заглушка из .env.example в production равна отсутствию секрета: подписи можно подделать.
  if (process.env.NODE_ENV === "production" && (secret.length < 32 || /change-?me/i.test(secret))) {
    throw new Error("SESSION_SECRET must be a random string of at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key());
}

export async function verifyToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
