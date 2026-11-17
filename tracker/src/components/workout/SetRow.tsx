"use client";

import clsx from "clsx";
import { Check, Trophy, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RecordType } from "@/lib/records";
import { displayToKg, kgToDisplay, type Units } from "@/lib/units";
import { fieldsForKind, type SetDTO, type SetType, type SetValues } from "@/lib/workout-types";
import { NumInput } from "./NumInput";

const NEXT_TYPE: Record<SetType, SetType> = {
  working: "warmup",
  warmup: "failure",
  failure: "working",
};

export function prevHint(p: SetValues | undefined, kind: string, units: Units): string {
  if (!p) return "—";
  const f = fieldsForKind(kind);
  const parts: string[] = [];
  if (f.weight && f.reps) return `${kgToDisplay(p.weightKg, units)}×${p.reps}`;
  if (f.weight) parts.push(`${kgToDisplay(p.weightKg, units)}`);
  if (f.reps) parts.push(`${p.reps}`);
  if (f.distance) parts.push(`${p.distanceKm} km`);
  if (f.duration) parts.push(`${p.durationSec}s`);
  return parts.join(" · ") || "—";
}

export function SetRow({
  set,
  label,
  kind,
  units,
  prev,
  onChange,
  onToggleDone,
  onDelete,
  records = [],
}: {
  set: SetDTO;
  label: string;
  kind: string;
  units: Units;
  prev?: SetValues;
  onChange: (patch: Partial<SetValues>) => void;
  onToggleDone: () => void;
  onDelete: () => void;
  records?: RecordType[];
}) {
  const t = useTranslations("workout");
  const f = fieldsForKind(kind);
  const typeLabel = set.type === "warmup" ? "W" : set.type === "failure" ? "F" : label;

  return (
    <li
      data-testid="set-row"
      data-done={set.done}
      className={clsx(
        "grid items-center gap-2 rounded-control p-1",
        set.done ? "bg-accent-soft" : "bg-transparent",
      )}
      style={{
        gridTemplateColumns: `2.75rem 4.5rem repeat(${
          Number(f.weight) + Number(f.reps) + Number(f.duration) + Number(f.distance)
        }, minmax(0, 1fr)) 2.75rem 2rem`,
      }}
    >
      <button
        type="button"
        onClick={() => onChange({ type: NEXT_TYPE[set.type] })}
        aria-label={`${t("setType")}: ${t(`types.${set.type}`)}`}
        className={clsx(
          "grid size-11 place-items-center rounded-control text-sm font-bold",
          set.type === "warmup" && "bg-warning/20 text-warning",
          set.type === "failure" && "bg-danger/15 text-danger",
          set.type === "working" && "bg-surface-2 text-muted",
        )}
      >
        {typeLabel}
      </button>

      <span className="truncate text-center text-xs text-muted" title={t("previous")}>
        {prevHint(prev, kind, units)}
      </span>

      {f.weight && (
        <NumInput
          decimal
          label={`${t("weight")} ${label}`}
          value={kgToDisplay(set.weightKg, units)}
          onCommit={(n) => onChange({ weightKg: displayToKg(n, units) })}
        />
      )}
      {f.reps && (
        <NumInput
          label={`${t("reps")} ${label}`}
          value={set.reps}
          max={1000}
          onCommit={(n) => onChange({ reps: n })}
        />
      )}
      {f.distance && (
        <NumInput
          decimal
          label={`${t("distance")} ${label}`}
          value={set.distanceKm}
          onCommit={(n) => onChange({ distanceKm: n })}
        />
      )}
      {f.duration && (
        <NumInput
          label={`${t("seconds")} ${label}`}
          value={set.durationSec}
          max={86400}
          onCommit={(n) => onChange({ durationSec: n })}
        />
      )}

      <button
        type="button"
        onClick={onToggleDone}
        aria-pressed={set.done}
        aria-label={`${t("done")} ${label}`}
        className={clsx(
          "grid size-11 place-items-center rounded-control",
          set.done ? "bg-[#15803d] text-white" : "bg-surface-2 text-muted hover:bg-border",
        )}
      >
        <Check className="size-5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`${t("deleteSet")} ${label}`}
        className="grid size-8 place-items-center rounded-control text-muted hover:bg-surface-2"
      >
        <X className="size-4" aria-hidden />
      </button>
      {records.length > 0 && (
        <span
          data-testid="pr-badge"
          className="col-span-full inline-flex items-center gap-1.5 px-1 pb-1 text-xs font-semibold text-gold-text"
        >
          <Trophy className="size-3.5" aria-hidden />
          {t("record")}: {records.map((r) => t(`recordTypes.${r}`)).join(", ")}
        </span>
      )}
    </li>
  );
}
