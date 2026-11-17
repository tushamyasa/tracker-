"use client";

import { useTranslations } from "next-intl";
import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import type { FormState } from "@/server/actions/auth";
import { createFolder } from "@/server/actions/templates";

export function FolderForm() {
  const t = useTranslations("templates");
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (prev: FormState, data: FormData) => {
    const res = await createFolder(prev, data);
    if (!res?.error) ref.current?.reset();
    return res;
  }, undefined);
  return (
    <form ref={ref} action={action} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
        {t("newFolder")}
        <input
          name="name"
          required
          maxLength={40}
          className="min-h-11 rounded-control border border-border bg-surface-2 px-3 text-base text-text"
        />
      </label>
      <Button type="submit" variant="secondary" loading={pending}>
        {t("createFolder")}
      </Button>
      {state?.error && (
        <p role="alert" className="w-full text-sm text-danger">
          {t("folderError")}
        </p>
      )}
    </form>
  );
}
