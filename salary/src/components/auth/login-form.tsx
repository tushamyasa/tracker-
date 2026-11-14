"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { loginAction, type AuthFormState } from "@/server/actions/auth";
import { AuthField } from "./auth-field";

const initial: AuthFormState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error ? (
        <p role="alert" className="rounded-md border border-expense/40 bg-expense/10 px-3 py-2 text-sm text-expense">
          {state.error}
        </p>
      ) : null}
      <AuthField
        id="email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        defaultValue={state.email}
        error={state.fieldErrors?.email}
        autoFocus
      />
      <AuthField
        id="password"
        name="password"
        label="Пароль"
        type="password"
        autoComplete="current-password"
        error={state.fieldErrors?.password}
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Вход…" : "Войти"}
      </Button>
    </form>
  );
}
