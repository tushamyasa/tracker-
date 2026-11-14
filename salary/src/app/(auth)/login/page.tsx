import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Вход — Salary" };

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">Вход</h1>
      <LoginForm />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Нет аккаунта?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </>
  );
}
