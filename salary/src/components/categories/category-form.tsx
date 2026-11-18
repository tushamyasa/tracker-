"use client";

import * as React from "react";
import { toast } from "sonner";
import { createCategory, updateCategory } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCategoryIcon, CATEGORY_COLORS } from "@/lib/category-icons";
import type { Category } from "@/db/schema";
import { ColorPicker, IconPicker } from "./pickers";

type Type = "income" | "expense";

export function CategoryForm({
  category,
  defaultType,
  onDone,
}: {
  category?: Category;
  defaultType: Type;
  onDone: () => void;
}) {
  const [name, setName] = React.useState(category?.name ?? "");
  const [color, setColor] = React.useState(category?.color ?? CATEGORY_COLORS[0]);
  const [icon, setIcon] = React.useState(category?.icon ?? "wallet");
  const [type, setType] = React.useState<Type>(category?.type ?? defaultType);
  const [error, setError] = React.useState<string>();
  const [pending, startTransition] = React.useTransition();
  const Preview = getCategoryIcon(icon);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const input = { name, type, color, icon };
      const res = category ? await updateCategory(category.id, input) : await createCategory(input);
      if (!res.ok) return setError(res.error);
      toast.success(category ? "Категория обновлена" : "Категория создана");
      onDone();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: color + "22", color }}
        >
          <Preview className="h-5 w-5" />
        </span>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название категории"
          maxLength={40}
          required
          autoFocus
          aria-label="Название"
        />
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-md border border-border p-1" role="radiogroup" aria-label="Тип">
        {(["income", "expense"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => setType(t)}
            className={
              "h-8 rounded-md text-sm font-medium transition-colors " +
              (type === t
                ? t === "income"
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-rose-500 text-white"
                : "text-muted-foreground hover:bg-foreground/10")
            }
          >
            {t === "income" ? "Доход" : "Расход"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Цвет</p>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Иконка</p>
        <IconPicker value={icon} color={color} onChange={setIcon} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-rose-500">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Отмена
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Сохранение…" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
