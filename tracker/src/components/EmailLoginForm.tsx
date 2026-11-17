"use client";

import { MailCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signIn } from "@/server/actions/auth";

/** Форма входа в режиме AUTH_MODE=email: запрос ссылки и экран «проверьте почту». */
export function EmailLoginForm() {
  const t = useTranslations("auth");
  const e = useTranslations("errors");
  const [state, action, pending] = useActionState(signIn, undefined);
  // «Указать другой адрес» скрывает экран подтверждения до следующей отправки.
  const [dismissed, setDismissed] = useState<unknown>(null);
  // Сравниваем объекты состояния, а не адреса: повторная отправка того же адреса снова покажет экран.
  const showSent = state?.sent && state !== dismissed;

  if (showSent) {
    return (
      <div
        role="status"
        data-testid="link-sent"
        className="flex flex-col items-start gap-3 rounded-card bg-surface p-5"
      >
        <MailCheck className="size-8 text-accent-text" aria-hidden />
        <h2 className="text-xl font-bold">{t("sentTitle")}</h2>
        <p>{t("sentText", { email: state.sent! })}</p>
        <p className="text-sm text-muted">{t("sentSpam")}</p>
        <Button variant="secondary" onClick={() => setDismissed(state)}>
          {t("again")}
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <Input
        label={t("email")}
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
      />
      <p className="-mt-2 text-sm text-muted">{t("hintEmail")}</p>
      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {e(state.error)}
        </p>
      )}
      <Button type="submit" size="lg" loading={pending}>
        {t("submitEmail")}
      </Button>
    </form>
  );
}
