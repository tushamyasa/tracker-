import { SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { EmptyState } from "@/components/ui/Card";

/** 404 для несуществующих адресов (вне защищённой части приложения). */
export default async function RootNotFound() {
  const t = await getTranslations("common");
  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <EmptyState
        icon={<SearchX className="size-8" aria-hidden />}
        title={t("notFoundTitle")}
        text={t("notFoundText")}
        action={
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-control bg-accent px-4 text-sm font-semibold text-white"
          >
            {t("toHome")}
          </Link>
        }
      />
    </main>
  );
}
