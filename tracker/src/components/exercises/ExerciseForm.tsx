"use client";

import { useTranslations } from "next-intl";
import { ActionForm } from "@/components/ActionForm";
import { Input } from "@/components/ui/Input";
import { EQUIPMENT, KINDS, MUSCLE_GROUPS } from "@/lib/exercises";
import type { FormState } from "@/server/actions/auth";

export interface ExerciseValues {
  name: string;
  muscleGroup: string;
  equipment: string;
  kind: string;
  description: string;
  hasPhoto: boolean;
}

function Select({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: [string, string][];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-muted">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={value}
        className="min-h-11 rounded-control border border-border bg-surface-2 px-3 text-base"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ExerciseForm({
  action,
  values,
  submitLabel,
}: {
  action: (state: FormState, data: FormData) => Promise<FormState>;
  values: ExerciseValues;
  submitLabel: string;
}) {
  const t = useTranslations("exercises");
  return (
    <ActionForm action={action} submitLabel={submitLabel}>
      <Input label={t("name")} name="name" defaultValue={values.name} required maxLength={80} />
      <Select
        name="muscleGroup"
        label={t("muscle")}
        value={values.muscleGroup}
        options={MUSCLE_GROUPS.map((m) => [m, t(`muscles.${m}`)] as [string, string])}
      />
      <Select
        name="equipment"
        label={t("equipmentLabel")}
        value={values.equipment}
        options={EQUIPMENT.map((e) => [e, t(`equipment.${e}`)] as [string, string])}
      />
      <Select
        name="kind"
        label={t("kind")}
        value={values.kind}
        options={KINDS.map((k) => [k, t(`kinds.${k}`)] as [string, string])}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-muted">
          {t("description")}
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={values.description}
          maxLength={1000}
          rows={4}
          className="rounded-control border border-border bg-surface-2 p-3 text-base"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="photo" className="text-sm font-medium text-muted">
          {t("photo")}
        </label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="text-sm"
        />
        <p className="text-xs text-muted">{t("photoHint")}</p>
        {values.hasPhoto && (
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" name="removePhoto" className="size-5 accent-[var(--accent)]" />
            {t("removePhoto")}
          </label>
        )}
      </div>
    </ActionForm>
  );
}
