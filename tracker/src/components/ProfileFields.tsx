"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";

export interface ProfileValues {
  name: string;
  goal: string;
  experience: string;
  weeklyGoal: number;
  units: string;
  locale: string;
  theme?: string;
  restDefaultSec?: number;
  effectsEnabled?: boolean;
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

export function ProfileFields({ values, full }: { values: ProfileValues; full?: boolean }) {
  const t = useTranslations("profile");
  const s = useTranslations("settings");
  return (
    <div className="flex flex-col gap-4">
      <Input label={t("name")} name="name" defaultValue={values.name} required maxLength={60} />
      <Select
        name="goal"
        label={t("goal")}
        value={values.goal}
        options={[
          ["strength", t("goals.strength")],
          ["mass", t("goals.mass")],
          ["endurance", t("goals.endurance")],
          ["health", t("goals.health")],
        ]}
      />
      <Select
        name="experience"
        label={t("experience")}
        value={values.experience}
        options={[
          ["beginner", t("levels.beginner")],
          ["intermediate", t("levels.intermediate")],
          ["advanced", t("levels.advanced")],
        ]}
      />
      <Select
        name="weeklyGoal"
        label={t("weeklyGoal")}
        value={String(values.weeklyGoal)}
        options={[1, 2, 3, 4, 5, 6, 7].map((n) => [String(n), String(n)] as [string, string])}
      />
      <Select
        name="units"
        label={t("units")}
        value={values.units}
        options={[
          ["kg", t("kg")],
          ["lb", t("lb")],
        ]}
      />
      <Select
        name="locale"
        label={s("language")}
        value={values.locale}
        options={[
          ["ru", "Русский"],
          ["en", "English"],
        ]}
      />
      {full && (
        <>
          <Select
            name="theme"
            label={s("theme")}
            value={values.theme ?? "system"}
            options={[
              ["system", s("system")],
              ["light", s("light")],
              ["dark", s("dark")],
            ]}
          />
          <Input
            label={t("rest")}
            name="restDefaultSec"
            type="number"
            min={15}
            max={600}
            step={15}
            defaultValue={values.restDefaultSec ?? 90}
          />
          <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              name="effectsEnabled"
              defaultChecked={values.effectsEnabled ?? true}
              className="size-5 accent-[var(--accent)]"
            />
            {t("effects")}
          </label>
        </>
      )}
    </div>
  );
}
