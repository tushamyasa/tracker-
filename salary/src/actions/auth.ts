"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { db } from "@/db";
import { categories, users } from "@/db/schema";
import { signIn, signOut } from "@/auth";
import { DEFAULT_CATEGORIES } from "@/lib/default-categories";
import { loginSchema, registerSchema } from "@/lib/validation";

export type FormState = { error?: string } | undefined;

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await signIn("credentials", { ...parsed.data, redirectTo: "/dashboard" });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Неверный email или пароль" };
    throw e; // redirect
  }
}

export async function registerAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) return { error: "Пользователь с таким email уже существует" };

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(users).values({ name, email, passwordHash }).returning();
  await db
    .insert(categories)
    .values(DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: user.id, isDefault: true })));

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Аккаунт создан, войдите вручную" };
    throw e;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
