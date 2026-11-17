"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BODY_METRICS, bodyUnit } from "@/lib/body";
import type { Units } from "@/lib/units";
import type { FormState } from "@/server/actions/auth";
import { saveMeasurement } from "@/server/actions/body";

/** Локальная дата YYYY-MM-DD. */
function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function BodyForm({ units }: { units: Units }) {
  const t = useTranslations("body");
  const e = useTranslations("errors");
  const ref = useRef<HTMLFormElement>(null);
  const [date, setDate] = useState(""); // часовой пояс известен только в браузере
  const [saved, setSaved] = useState(false);
  useEffect(() => setDate(today()), []);

  const [state, action, pending] = useActionState(async (prev: FormState, data: FormData) => {
    const res = await saveMeasurement(prev, data);
    if (!res?.error) {
      // очищаем числовые поля, дату оставляем
      ref.current
        ?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[inputmode], textarea")
        .forEach((el) => (el.value = ""));
      setSaved(true);
    } else {
      setSaved(false);
    }
    return res;
  }, undefined);

  return (
    <form ref={ref} action={action} className="flex flex-col gap-4" data-testid="body-form">
      <Input
        label={t("date")}
        name="date"
        type="date"
        value={date}
        onChange={(ev) => setDate(ev.target.value)}
        required
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {BODY_METRICS.map((m) => (
          <Input
            key={m}
            label={`${t(`metrics.${m}`)}, ${bodyUnit(m, units)}`}
            name={m}
            inputMode="decimal"
            placeholder="—"
            autoComplete="off"
          />
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="body-note" className="text-sm font-medium text-muted">
          {t("note")}
        </label>
        <textarea
          id="body-note"
          name="note"
          rows={2}
          maxLength={200}
          className="rounded-control border border-border bg-surface-2 p-3 text-base"
        />
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {e(state.error)}
        </p>
      )}
      {saved && !state?.error && (
        <p role="status" className="text-sm text-success" data-testid="body-saved">
          {t("saved")}
        </p>
      )}
      <Button type="submit" size="lg" loading={pending}>
        {t("save")}
      </Button>
    </form>
  );
}
