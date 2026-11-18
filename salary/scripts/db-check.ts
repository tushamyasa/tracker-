import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { categories, transactions, users } from "../src/db/schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});
const db = drizzle(client);

async function main() {
  await client.execute("PRAGMA foreign_keys = ON");
  const email = `check-${Date.now()}@example.test`;
  const [u] = await db.insert(users).values({ email, name: "Check" }).returning();
  const [c] = await db.insert(categories).values({ userId: u.id, name: "Зарплата", type: "income" }).returning();
  await db.insert(transactions).values({ userId: u.id, categoryId: c.id, type: "income", amount: 1000, date: new Date() });
  const rows = await db.select().from(transactions).where(eq(transactions.userId, u.id));
  console.log("transactions:", rows.length);
  await db.delete(users).where(eq(users.id, u.id));
  const left = await db.select().from(transactions).where(eq(transactions.userId, u.id));
  console.log("after cascade delete:", left.length);
  if (rows.length !== 1 || left.length !== 0) throw new Error("db check failed");
  console.log("DB OK");
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
