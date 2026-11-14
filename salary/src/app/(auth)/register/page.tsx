import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Регистрация — Salary" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">Регистрация</h1>
      <RegisterForm />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Войти
        </Link>
      </p>
    </>
  );
}
