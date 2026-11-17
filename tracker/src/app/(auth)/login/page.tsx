import { getTranslations } from "next-intl/server";
import { ActionForm } from "@/components/ActionForm";
import { EmailLoginForm } from "@/components/EmailLoginForm";
import { Input } from "@/components/ui/Input";
import { authMode } from "@/lib/auth-config";
import { pageTitle } from "@/lib/page-title";
import { signIn } from "@/server/actions/auth";

export async function generateMetadata() {
  return { title: await pageTitle("auth.submit") };
}

export default async function LoginPage() {
  const t = await getTranslations();
  return (
    <>
      <div>
        <h1 className="text-3xl font-extrabold">{t("app.name")}</h1>
        <p className="mt-2 text-muted">{t("app.tagline")}</p>
      </div>
      {authMode() === "email" ? (
        <EmailLoginForm />
      ) : (
        <ActionForm action={signIn} submitLabel={t("auth.submit")}>
          <Input
            label={t("auth.email")}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
          <p className="-mt-2 text-sm text-muted">{t("auth.hint")}</p>
        </ActionForm>
      )}
    </>
  );
}
