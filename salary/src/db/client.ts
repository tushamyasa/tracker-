import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  throw new Error("TURSO_DATABASE_URL не задан (см. .env.example)");
}

const globalForDb = globalThis as unknown as { __libsql?: ReturnType<typeof createClient> };

const client =
  globalForDb.__libsql ??
  createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined });

if (process.env.NODE_ENV !== "production") globalForDb.__libsql = client;

export const db = drizzle(client, { schema });
export type Db = typeof db;
