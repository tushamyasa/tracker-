import { z } from "zod";

/** Приводит email к каноническому виду: без пробелов, в нижнем регистре. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

const emailSchema = z.email();

/** Принимает любой синтаксически корректный адрес (даже вымышленный). */
export function parseEmail(raw: string): string | null {
  const email = normalizeEmail(raw);
  const res = emailSchema.safeParse(email);
  return res.success ? email : null;
}
