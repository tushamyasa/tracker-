import { Construction } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "./ui/Card";

export async function PlaceholderPage({ titleKey }: { titleKey: string }) {
  const t = await getTranslations();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold">{t(titleKey)}</h1>
      <EmptyState
        icon={<Construction className="size-8" aria-hidden />}
        title={t("common.soon")}
        text={t("common.soonText")}
      />
    </div>
  );
}
