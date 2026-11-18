"use client";

import { Check } from "lucide-react";
import { CATEGORY_COLORS, CATEGORY_ICONS, ICON_NAMES } from "@/lib/category-icons";
import { cn } from "@/lib/utils";

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Цвет">
      {CATEGORY_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={c}
          onClick={() => onChange(c)}
          style={{ backgroundColor: c }}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md text-white ring-offset-2 ring-offset-popover transition",
            value === c && "ring-2 ring-foreground",
          )}
        >
          {value === c && <Check className="h-4 w-4" />}
        </button>
      ))}
    </div>
  );
}

export function IconPicker({
  value,
  color,
  onChange,
}: {
  value: string;
  color: string;
  onChange: (i: string) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Иконка">
      {ICON_NAMES.map((name) => {
        const Icon = CATEGORY_ICONS[name];
        const active = value === name;
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={name}
            onClick={() => onChange(name)}
            style={active ? { color, borderColor: color, backgroundColor: color + "22" } : undefined}
            className="flex h-10 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-foreground/10"
          >
            <Icon className="h-5 w-5" />
          </button>
        );
      })}
    </div>
  );
}
