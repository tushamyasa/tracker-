import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma CLI считает относительный путь SQLite от папки prisma/, а рантайм Next.js
 * — от места сборки. Делаем путь абсолютным, чтобы везде использовался один файл.
 */
function datasourceUrl(): string {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  if (!url.startsWith("file:")) return url;
  const file = url.slice("file:".length);
  return "file:" + (path.isAbsolute(file) ? file : path.resolve(process.cwd(), "prisma", file));
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: datasourceUrl() });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
