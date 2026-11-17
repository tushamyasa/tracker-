import { SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { EmptyState } from "@/components/ui/Card";

export default async function NotFound() {
  const t = await getTranslations("common");
  return (
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
  );
}
