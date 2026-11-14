"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { CATEGORY_ICONS } from "@/lib/icons";
import { CATEGORY_COLORS } from "@/lib/palette";
import type { Category, TransactionType } from "@/db/schema";
import { cn } from "@/lib/utils";
import {
  createCategoryAction,
  updateCategoryAction,
  type CategoryActionResult,
} from "@/server/actions/categories";
import { CategoryBadge, CategoryGlyph } from "./category-icon";

export type FormMode =
  | { kind: "create"; type: TransactionType }
  | { kind: "edit"; category: Category };

type FieldErrors = Partial<Record<"name" | "icon" | "color", string>>;

export function CategoryFormSheet({
  mode,
  onOpenChange,
}: {
  mode: FormMode | null;
  onOpenChange: (open: boolean) => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const title =
    mode?.kind === "edit"
      ? "Редактировать категорию"
      : mode?.type === "income"
        ? "Новая категория дохода"
        : "Новая категория расхода";

  return (
    <Sheet open={mode !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className="data-[side=right]:w-full data-[side=right]:sm:max-w-[420px] data-[side=bottom]:max-h-[92dvh] data-[side=bottom]:rounded-t-xl"
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Название, иконка и цвет отображаются в операциях и отчётах.</SheetDescription>
        </SheetHeader>
        {mode ? (
          <CategoryForm
            key={mode.kind === "edit" ? mode.category.id : `new-${mode.type}`}
            mode={mode}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function CategoryForm({ mode, onDone }: { mode: FormMode; onDone: () => void }) {
  const initial = mode.kind === "edit" ? mode.category : null;
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState<string>(initial?.icon ?? CATEGORY_ICONS[0]);
  const [color, setColor] = useState<string>(initial?.color ?? CATEGORY_COLORS[0]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    startTransition(async () => {
      const result: CategoryActionResult =
        mode.kind === "edit"
          ? await updateCategoryAction(mode.category.id, { name, icon, color })
          : await createCategoryAction({ name, type: mode.type, icon, color });

      if (result.ok) {
        toast.success(mode.kind === "edit" ? "Категория сохранена" : "Категория добавлена");
        onDone();
      } else {
        setErrors(result.fieldErrors ?? {});
        if (!result.fieldErrors?.name) setFormError(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col" noValidate>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4">
        <div className="flex items-center gap-3 rounded-lg border bg-surface p-3">
          <CategoryBadge icon={icon} color={color} className="size-10" />
          <span className="truncate font-medium">{name.trim() || "Название категории"}</span>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category-name">Название</Label>
          <Input
            id="category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            autoFocus
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "category-name-error" : undefined}
          />
          {errors.name ? (
            <p id="category-name-error" className="text-sm text-expense">
              {errors.name}
            </p>
          ) : null}
        </div>

        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium">Иконка</legend>
          <div role="radiogroup" aria-label="Иконка" className="grid grid-cols-6 gap-1.5">
            {CATEGORY_ICONS.map((key) => {
              const selected = key === icon;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={key}
                  onClick={() => setIcon(key)}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-md border transition-colors",
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-transparent text-muted-foreground hover:bg-accent",
                  )}
                >
                  <CategoryGlyph name={key} className="size-5" />
                </button>
              );
            })}
          </div>
          {errors.icon ? <p className="text-sm text-expense">{errors.icon}</p> : null}
        </fieldset>

        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium">Цвет</legend>
          <div role="radiogroup" aria-label="Цвет" className="flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={c === color}
                aria-label={c}
                onClick={() => setColor(c)}
                className="flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-popover transition focus-visible:ring-2 focus-visible:ring-ring"
                style={{ backgroundColor: c }}
              >
                {c === color ? <Check className="size-4 text-white" /> : null}
              </button>
            ))}
          </div>
          {errors.color ? <p className="text-sm text-expense">{errors.color}</p> : null}
        </fieldset>

        {formError ? (
          <p role="alert" className="text-sm text-expense">
            {formError}
          </p>
        ) : null}
      </div>

      <div className="flex gap-2 border-t p-4">
        <Button type="button" variant="outline" className="flex-1" onClick={onDone} disabled={pending}>
          Отмена
        </Button>
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? "Сохранение…" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
