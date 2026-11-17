"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import type { FormState } from "@/server/actions/auth";

export function ActionForm({
  action,
  submitLabel,
  children,
}: {
  action: (state: FormState, data: FormData) => Promise<FormState>;
  submitLabel: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("errors");
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="flex flex-col gap-5">
      {children}
      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {t(state.error)}
        </p>
      )}
      <Button type="submit" size="lg" loading={pending}>
        {submitLabel}
      </Button>
    </form>
  );
}
