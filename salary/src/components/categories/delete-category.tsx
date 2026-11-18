"use client";

import * as React from "react";
import { toast } from "sonner";
import { deleteCategory } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import type { Category } from "@/db/schema";

export function DeleteCategory({
  category,
  txCount,
  onDone,
}: {
  category: Category;
  txCount: number;
  onDone: () => void;
}) {
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string>();

  function run(strategy?: "move" | "delete") {
    setError(undefined);
    startTransition(async () => {
      const res = await deleteCategory(category.id, strategy);
      if (!res.ok) return setError(res.error);
      toast.success("Категория удалена");
      onDone();
    });
  }

  return (
    <div className="space-y-4">
      {txCount === 0 ? (
        <p className="text-sm">Удалить категорию «{category.name}»? Это действие нельзя отменить.</p>
      ) : (
        <p className="text-sm">
          В категории «{category.name}» {txCount} {plural(txCount)}. Что с ними сделать?
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-rose-500">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onDone} disabled={pending}>
          Отмена
        </Button>
        {txCount === 0 ? (
          <Button variant="destructive" onClick={() => run()} disabled={pending}>
            Удалить
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={() => run("move")} disabled={pending}>
              Перенести в «Другое»
            </Button>
            <Button variant="destructive" onClick={() => run("delete")} disabled={pending}>
              Удалить вместе с операциями
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function plural(n: number) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "операция";
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return "операции";
  return "операций";
}
