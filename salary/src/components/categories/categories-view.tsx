"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { getCategoryIcon } from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import type { Category } from "@/db/schema";
import { CategoryForm } from "./category-form";
import { DeleteCategory } from "./delete-category";

type Item = Category & { txCount: number };
type Type = "income" | "expense";
type Modal = { kind: "form"; category?: Item } | { kind: "delete"; category: Item } | null;

export function CategoriesView({ items }: { items: Item[] }) {
  const [tab, setTab] = React.useState<Type>("expense");
  const [modal, setModal] = React.useState<Modal>(null);
  const list = items.filter((c) => c.type === tab);
  const close = () => setModal(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Категории</h1>
        <Button onClick={() => setModal({ kind: "form" })}>
          <Plus className="h-4 w-4" />
          Добавить
        </Button>
      </div>

      <div className="grid max-w-xs grid-cols-2 gap-1 rounded-md border border-border p-1" role="tablist">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "h-8 rounded-md text-sm font-medium transition-colors",
              tab === t
                ? t === "income"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                : "text-muted-foreground hover:bg-foreground/5",
            )}
          >
            {t === "income" ? "Доходы" : "Расходы"}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Card className="text-sm text-muted-foreground">Категорий пока нет. Добавьте первую.</Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => {
            const Icon = getCategoryIcon(c.icon);
            return (
              <li key={c.id}>
                <Card className="flex items-center gap-3 p-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: c.color + "22", color: c.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.txCount} операций</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Редактировать ${c.name}`}
                    onClick={() => setModal({ kind: "form", category: c })}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Удалить ${c.name}`}
                    onClick={() => setModal({ kind: "delete", category: c })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={modal !== null}
        onClose={close}
        title={
          modal?.kind === "delete"
            ? "Удаление категории"
            : modal?.category
              ? "Редактирование категории"
              : "Новая категория"
        }
      >
        {modal?.kind === "form" && (
          <CategoryForm key={modal.category?.id ?? "new"} category={modal.category} defaultType={tab} onDone={close} />
        )}
        {modal?.kind === "delete" && (
          <DeleteCategory category={modal.category} txCount={modal.category.txCount} onDone={close} />
        )}
      </Dialog>
    </div>
  );
}
