"use client";

import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Card";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <EmptyState
      icon={<TriangleAlert className="size-8" aria-hidden />}
      title={t("errorTitle")}
      text={t("errorText")}
      action={<Button onClick={reset}>{t("retry")}</Button>}
    />
  );
}
