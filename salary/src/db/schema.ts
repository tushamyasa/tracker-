import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";

export const TRANSACTION_TYPES = ["income", "expense"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

const now = () => Date.now();

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(createId),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  currency: text("currency").notNull().default("RUB"),
  theme: text("theme", { enum: THEMES }).notNull().default("system"),
  createdAt: integer("created_at").notNull().$defaultFn(now),
});

export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type", { enum: TRANSACTION_TYPES }).notNull(),
    icon: text("icon").notNull(),
    color: text("color").notNull(),
    isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at").notNull().$defaultFn(now),
  },
  (t) => [
    unique("categories_user_type_name_uq").on(t.userId, t.type, t.name),
    check("categories_type_ck", sql`${t.type} in ('income','expense')`),
    index("categories_user_idx").on(t.userId, t.type),
  ],
);

export const transactions = sqliteTable(
  "transactions",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    type: text("type", { enum: TRANSACTION_TYPES }).notNull(),
    /** Сумма в минорных единицах (копейках), всегда > 0 */
    amount: integer("amount").notNull(),
    /** Дата в формате YYYY-MM-DD */
    date: text("date").notNull(),
    note: text("note"),
    createdAt: integer("created_at").notNull().$defaultFn(now),
    updatedAt: integer("updated_at").notNull().$defaultFn(now),
  },
  (t) => [
    check("transactions_amount_ck", sql`${t.amount} > 0`),
    check("transactions_type_ck", sql`${t.type} in ('income','expense')`),
    index("transactions_user_date_idx").on(t.userId, t.date),
    index("transactions_user_category_idx").on(t.userId, t.categoryId),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
