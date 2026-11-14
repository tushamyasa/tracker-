"use client";

import { Archive, ArchiveRestore, EllipsisVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TransactionType } from "@/db/schema";
import { cn } from "@/lib/utils";
import { setCategoryArchivedAction } from "@/server/actions/categories";
import type { CategoryWithCount } from "@/server/categories";
import { CategoryBadge } from "./category-icon";
import { CategoryFormSheet, type FormMode } from "./category-form-sheet";
import { DeleteCategoryDialog } from "./delete-category-dialog";

const TABS: { type: TransactionType; label: string }[] = [
  { type: "expense", label: "Расходы" },
  { type: "income", label: "Доходы" },
];

export function CategoriesView({ categories }: { categories: CategoryWithCount[] }) {
  const [tab, setTab] = useState<TransactionType>("expense");
  const [showArchived, setShowArchived] = useState(false);
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [toDelete, setToDelete] = useState<CategoryWithCount | null>(null);
  const [, startTransition] = useTransition();

  const ofType = categories.filter((c) => c.type === tab);
  const archivedCount = ofType.filter((c) => c.isArchived).length;
  const visible = ofType.filter((c) => showArchived || !c.isArchived);

  function toggleArchive(c: CategoryWithCount) {
    startTransition(async () => {
      const r = await setCategoryArchivedAction(c.id, !c.isArchived);
      if (r.ok) toast.success(c.isArchived ? "Категория восстановлена" : "Категория в архиве");
      else toast.error(r.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Тип категорий" className="inline-flex rounded-lg border bg-surface p-1">
          {TABS.map(({ type, label }) => (
            <button
              key={type}
              role="tab"
              type="button"
              aria-selected={tab === type}
              onClick={() => setTab(type)}
              className={cn(
                "h-8 rounded-md px-4 text-sm font-medium transition-colors",
                tab === type
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <Button onClick={() => setFormMode({ kind: "create", type: tab })} size="lg">
          <Plus className="size-4" />
          Категория
        </Button>
      </div>

      {archivedCount > 0 ? (
        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Показать архивные ({archivedCount})
        </label>
      ) : null}

      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-surface px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">Категорий пока нет.</p>
          <Button className="mt-3" onClick={() => setFormMode({ kind: "create", type: tab })}>
            Добавить первую категорию
          </Button>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border bg-card" role="tabpanel">
          {visible.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
              <CategoryBadge icon={c.icon} color={c.color} />
              <div className="min-w-0 flex-1">
                <p className={cn("truncate font-medium", c.isArchived && "text-muted-foreground line-through")}>
                  {c.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.txCount} опер.{c.isArchived ? " · в архиве" : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Редактировать «${c.name}»`}
                onClick={() => setFormMode({ kind: "edit", category: c })}
              >
                <Pencil className="size-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" size="icon" aria-label={`Действия «${c.name}»`} />}
                >
                  <EllipsisVertical className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => toggleArchive(c)}>
                    {c.isArchived ? (
                      <>
                        <ArchiveRestore className="size-4" /> Восстановить
                      </>
                    ) : (
                      <>
                        <Archive className="size-4" /> В архив
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setToDelete(c)}
                    className="text-expense focus:text-expense"
                  >
                    <Trash2 className="size-4" /> Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}

      <CategoryFormSheet mode={formMode} onOpenChange={(o) => !o && setFormMode(null)} />
      <DeleteCategoryDialog
        category={toDelete}
        candidates={categories.filter((c) => c.type === toDelete?.type)}
        onOpenChange={(o) => !o && setToDelete(null)}
      />
    </div>
  );
}
