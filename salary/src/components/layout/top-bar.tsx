"use client";

import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { titleFor } from "./nav-items";
import { useQuickAdd } from "./quick-add";

/** Верхняя панель: название раздела; на ≥768px — кнопка добавления операции. */
export function TopBar() {
  const pathname = usePathname();
  const { open } = useQuickAdd();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <h1 className="truncate text-base font-semibold md:text-lg">{titleFor(pathname)}</h1>
      <Button type="button" onClick={() => open()} className="hidden md:inline-flex" size="lg">
        <Plus className="size-4" />
        Операция
      </Button>
    </header>
  );
}
