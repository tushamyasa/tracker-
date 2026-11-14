import type { Metadata } from "next";
import { Suspense } from "react";
import { AppearanceForm, DeleteAccountForm, PasswordForm } from "@/components/settings/settings-forms";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/db/client";
import { getUserSettings } from "@/server/account";
import { requireUserId } from "@/server/session";

export const metadata: Metadata = { title: "Настройки — Salary" };

export default function SettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full max-w-2xl" />}>
      <SettingsContent />
    </Suspense>
  );
}

function Section({
  title,
  description,
  children,
  danger,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <section className={`rounded-lg border bg-card p-5 ${danger ? "border-expense/40" : ""}`}>
      <h2 className="text-base font-semibold">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

async function SettingsContent() {
  const userId = await requireUserId();
  const settings = await getUserSettings(db, userId);

  return (
    <div className="max-w-2xl space-y-4">
      <Section title="Профиль" description="Email используется для входа и не меняется.">
        <p className="text-sm font-medium">{settings?.email}</p>
      </Section>

      <Section title="Внешний вид и валюта">
        <AppearanceForm currency={settings?.currency ?? "RUB"} />
      </Section>

      <Section title="Смена пароля">
        <PasswordForm />
      </Section>

      <Section title="Удаление аккаунта" danger>
        <DeleteAccountForm />
      </Section>
    </div>
  );
}
