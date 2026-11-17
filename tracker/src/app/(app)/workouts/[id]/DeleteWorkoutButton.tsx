"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";

export function DeleteWorkoutButton({ action }: { action: () => Promise<void> }) {
  const t = useTranslations("history");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" className="text-danger" onClick={() => setOpen(true)}>
        {t("delete")}
      </Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={t("deleteTitle")}
        description={t("deleteText")}
      >
        <form action={action} className="flex flex-col gap-3">
          <Button type="submit" variant="danger" size="lg">
            {t("deleteConfirm")}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
        </form>
      </Sheet>
    </>
  );
}
