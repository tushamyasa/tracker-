"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CURRENCIES } from "@/lib/currencies";
import { cn } from "@/lib/utils";
import {
  changePasswordAction,
  deleteAccountAction,
  updateCurrencyAction,
  type AccountFormState,
} from "@/server/actions/account";

const selectClass =
  "h-9 w-full max-w-xs rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const THEMES = [
  { value: "light", label: "Светлая", icon: Sun },
  { value: "dark", label: "Тёмная", icon: Moon },
  { value: "system", label: "Системная", icon: Monitor },
] as const;

export function AppearanceForm({ currency }: { currency: string }) {
  const { theme, setTheme } = useTheme();
  const [value, setValue] = useState(currency);
  const [pending, startTransition] = useTransition();

  function changeCurrency(code: string) {
    const previous = value;
    setValue(code);
    startTransition(async () => {
      const r = await updateCurrencyAction(code);
      if (r.ok) toast.success("Валюта изменена");
      else {
        setValue(previous);
        toast.error(r.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Тема</legend>
        <div role="radiogroup" aria-label="Тема" className="inline-flex rounded-lg border bg-surface p-1">
          {THEMES.map(({ value: v, label, icon: Icon }) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={theme === v}
              onClick={() => setTheme(v)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
                theme === v ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="currency">Валюта</Label>
        <select
          id="currency"
          value={value}
          disabled={pending}
          onChange={(e) => changeCurrency(e.target.value)}
          className={selectClass}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Меняет только отображение сумм, суммы не пересчитываются.
        </p>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  autoComplete,
}: {
  id: string;
  label: string;
  error?: string;
  autoComplete: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type="password"
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="max-w-xs"
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-expense">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const initial: AccountFormState = {};

export function PasswordForm() {
  const [state, action, pending] = useActionState(
    async (prev: AccountFormState, fd: FormData) => {
      const next = await changePasswordAction(prev, fd);
      if (next.success) toast.success("Пароль изменён");
      return next;
    },
    initial,
  );

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error ? (
        <p role="alert" className="text-sm text-expense">
          {state.error}
        </p>
      ) : null}
      <Field id="currentPassword" label="Текущий пароль" autoComplete="current-password" error={state.fieldErrors?.currentPassword} />
      <Field id="newPassword" label="Новый пароль" autoComplete="new-password" error={state.fieldErrors?.newPassword} />
      <Field id="confirmPassword" label="Повторите новый пароль" autoComplete="new-password" error={state.fieldErrors?.confirmPassword} />
      <Button type="submit" disabled={pending}>
        {pending ? "Сохранение…" : "Сменить пароль"}
      </Button>
    </form>
  );
}

export function DeleteAccountForm() {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(deleteAccountAction, initial);

  if (!confirming) {
    return (
      <Button variant="destructive" onClick={() => setConfirming(true)}>
        Удалить аккаунт
      </Button>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      <p className="text-sm text-muted-foreground">
        Будут безвозвратно удалены аккаунт, все категории и операции. Введите пароль для подтверждения.
      </p>
      {state.error ? (
        <p role="alert" className="text-sm text-expense">
          {state.error}
        </p>
      ) : null}
      <Field id="password" label="Пароль" autoComplete="current-password" error={state.fieldErrors?.password} />
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => setConfirming(false)} disabled={pending}>
          Отмена
        </Button>
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending ? "Удаление…" : "Удалить навсегда"}
        </Button>
      </div>
    </form>
  );
}
