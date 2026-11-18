import { PrismaClient } from "@/generated/prisma/client";

/**
 * Один клиент на процесс. В dev-режиме Next перезагружает модули, поэтому клиент
 * хранится в globalThis, иначе при каждой правке открывались бы новые соединения.
 * Адрес базы берётся из DATABASE_URL (PostgreSQL).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
