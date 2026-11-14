"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { deleteCategoryAction } from "@/server/actions/categories";
import type { CategoryWithCount } from "@/server/categories";

export function DeleteCategoryDialog({
  category,
  candidates,
  onOpenChange,
}: {
  category: CategoryWithCount | null;
  /** Категории того же типа, куда можно перенести операции. */
  candidates: CategoryWithCount[];
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={category !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {category ? (
          <DeleteBody
            key={category.id}
            category={category}
            candidates={candidates.filter((c) => c.id !== category.id && !c.isArchived)}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DeleteBody({
  category,
  candidates,
  onDone,
}: {
  category: CategoryWithCount;
  candidates: CategoryWithCount[];
  onDone: () => void;
}) {
  const hasTx = category.txCount > 0;
  const [target, setTarget] = useState(candidates[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const cannotReassign = hasTx && candidates.length === 0;

  function confirm() {
    setError(null);
    startTransition(async () => {
      const r = await deleteCategoryAction(category.id, hasTx ? target : undefined);
      if (r.ok) {
        toast.success("Категория удалена");
        onDone();
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Удалить категорию «{category.name}»?</DialogTitle>
        <DialogDescription>
          {hasTx
            ? `В ней ${category.txCount} опер. Перенесите их в другую категорию — действие нельзя отменить.`
            : "Действие нельзя отменить."}
        </DialogDescription>
      </DialogHeader>

      {hasTx && !cannotReassign ? (
        <div className="space-y-1.5">
          <Label htmlFor="reassign-to">Перенести операции в</Label>
          <select
            id="reassign-to"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {cannotReassign ? (
        <p className="text-sm text-muted-foreground">
          Нет другой активной категории для переноса. Создайте новую или архивируйте эту категорию.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-expense">
          {error}
        </p>
      ) : null}

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={pending}>
          Отмена
        </Button>
        <Button
          variant="destructive"
          onClick={confirm}
          disabled={pending || cannotReassign || (hasTx && !target)}
        >
          {pending ? "Удаление…" : "Удалить"}
        </Button>
      </DialogFooter>
    </>
  );
}
