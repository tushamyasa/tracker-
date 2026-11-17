import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ActionForm";
import { ProfileFields } from "@/components/ProfileFields";
import { Button } from "@/components/ui/Button";
import { Download } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { deleteAccount, signOut, updateProfile } from "@/server/actions/auth";
import { requireUser } from "@/server/auth/session";
import { DeleteAccountButton } from "./DeleteAccountButton";
import { pageTitle } from "@/lib/page-title";

export async function generateMetadata() {
  return { title: await pageTitle("nav.profile") };
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser();
  const { saved } = await searchParams;
  const t = await getTranslations("profile");
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold">{t("title")}</h1>
        <p className="mt-1 text-muted">{user.email}</p>
      </div>
      {saved && (
        <p
          role="status"
          className="rounded-control bg-accent-soft px-4 py-3 text-sm text-accent-text"
        >
          {t("saved")}
        </p>
      )}
      <Card>
        <ActionForm action={updateProfile} submitLabel={t("save")}>
          <ProfileFields
            full
            values={{
              name: user.name ?? "",
              goal: user.goal ?? "strength",
              experience: user.experience ?? "beginner",
              weeklyGoal: user.weeklyGoal,
              units: user.units,
              locale: user.locale,
              theme: user.theme,
              restDefaultSec: user.restDefaultSec,
              effectsEnabled: user.effectsEnabled,
            }}
          />
        </ActionForm>
      </Card>
      <Card className="flex flex-col gap-3" data-testid="export-card">
        <h2 className="text-lg font-bold">{t("exportTitle")}</h2>
        <p className="text-sm text-muted">{t("exportText")}</p>
        <div className="flex flex-wrap gap-2">
          {[
            ["json", "/api/export?format=json", t("exportJson")],
            ["csv-sets", "/api/export?format=csv", t("exportCsvSets")],
            ["csv-body", "/api/export?format=csv&data=measurements", t("exportCsvBody")],
          ].map(([key, href, label]) => (
            <a
              key={key}
              href={href}
              download
              data-testid={`export-${key}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-control bg-surface-2 px-4 text-sm font-semibold hover:bg-border"
            >
              <Download className="size-4" aria-hidden />
              {label}
            </a>
          ))}
        </div>
      </Card>
      <Card className="flex flex-col gap-3">
        <form action={signOut}>
          <Button type="submit" variant="secondary" className="w-full">
            {t("signOut")}
          </Button>
        </form>
        <DeleteAccountButton action={deleteAccount} />
      </Card>
    </div>
  );
}
