"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Wallet } from "lucide-react";
import { loginAction, registerAction } from "@/actions/auth";

const input =
  "w-full h-10 rounded-md bg-white/5 border border-white/10 px-3 text-sm outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  const [state, action, pending] = useActionState(isLogin ? loginAction : registerAction, undefined);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="glass-panel rounded-md p-6 w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="h-9 w-9 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="font-bold tracking-tight text-lg">Salary</span>
        </div>
        <h1 className="text-xl font-semibold mb-4">{isLogin ? "Вход" : "Регистрация"}</h1>

        <form action={action} className="space-y-3">
          {!isLogin && (
            <input name="name" placeholder="Имя" autoComplete="name" required className={input} />
          )}
          <input name="email" type="email" placeholder="Email" autoComplete="email" required className={input} />
          <input
            name="password"
            type="password"
            placeholder="Пароль"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={isLogin ? undefined : 8}
            className={input}
          />
          {state?.error && (
            <p role="alert" className="text-sm text-rose-400">
              {state.error}
            </p>
          )}
          <button
            disabled={pending}
            className="w-full h-10 rounded-md bg-emerald-500 text-slate-950 text-sm font-medium hover:bg-emerald-400 disabled:opacity-60 transition-colors"
          >
            {pending ? "Подождите…" : isLogin ? "Войти" : "Создать аккаунт"}
          </button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          {isLogin ? "Нет аккаунта? " : "Уже есть аккаунт? "}
          <Link href={isLogin ? "/register" : "/login"} className="text-emerald-400 hover:underline">
            {isLogin ? "Регистрация" : "Войти"}
          </Link>
        </p>
      </div>
    </main>
  );
}
