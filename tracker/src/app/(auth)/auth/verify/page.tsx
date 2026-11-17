import { LinkIcon, TriangleAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { pageTitle } from "@/lib/page-title";
import { completeLogin } from "@/server/actions/auth";
import { peekLoginToken } from "@/server/auth/login-token";

export async function generateMetadata() {
  return { title: await pageTitle("auth.verifyTitle") };
}

/**
 * Страница подтверждения входа. Само открытие ссылки токен не расходует:
 * вход завершается нажатием кнопки (защита от почтовых сканеров, открывающих ссылки).
 */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const t = await getTranslations("auth");
  const valid = await peekLoginToken(token);

  if (!valid) {
    return (
      <div className="flex flex-col items-start gap-4" data-testid="link-invalid">
        <TriangleAlert className="size-8 text-warning" aria-hidden />
        <h1 className="text-2xl font-extrabold">{t("invalidTitle")}</h1>
        <p className="text-muted">{t("invalidText")}</p>
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center rounded-control bg-accent px-4 text-sm font-semibold text-white"
        >
          {t("backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <LinkIcon className="size-8 text-accent-text" aria-hidden />
      <h1 className="text-2xl font-extrabold">{t("verifyTitle")}</h1>
      <p className="text-muted">{t("verifyText")}</p>
      <form action={completeLogin.bind(null, token)} className="w-full">
        <Button type="submit" size="lg" className="w-full">
          {t("verifyButton")}
        </Button>
      </form>
    </div>
  );
}
