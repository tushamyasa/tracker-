"use client";

import { Ellipsis, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/server/actions/auth";
import { MORE_HREFS, NAV_ITEMS, isActive, type NavItem } from "./nav-items";
import { useQuickAdd } from "./quick-add";
import { ThemeToggle } from "./theme-toggle";

const byHref = (href: string) => NAV_ITEMS.find((i) => i.href === href) as NavItem;
const LEFT = [byHref("/dashboard"), byHref("/transactions")];
const MORE_ITEMS = MORE_HREFS.map(byHref);

const tabClass = (active: boolean) =>
  cn(
    "flex h-full flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
    active ? "text-primary" : "text-muted-foreground",
  );

/** Нижний tab-bar для телефона (<768px): 2 пункта · «+» · Категории · Ещё. */
export function BottomNav() {
  const pathname = usePathname();
  const { open: openQuickAdd } = useQuickAdd();
  const [moreOpen, setMoreOpen] = useState(false);
  const categories = byHref("/categories");
  const moreActive = MORE_ITEMS.some((i) => isActive(pathname, i.href));

  return (
    <>
      <nav
        aria-label="Основная навигация"
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {LEFT.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={tabClass(active)}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}

        <div className="relative flex flex-1 justify-center">
          <Button
            type="button"
            size="icon-lg"
            onClick={() => openQuickAdd()}
            aria-label="Добавить операцию"
            className="absolute -top-5 size-14 rounded-full shadow-lg"
          >
            <Plus className="size-6" />
          </Button>
        </div>

        <Link
          href={categories.href}
          aria-current={isActive(pathname, categories.href) ? "page" : undefined}
          className={tabClass(isActive(pathname, categories.href))}
        >
          <categories.icon className="size-5" />
          {categories.label}
        </Link>

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="Ещё"
          className={tabClass(moreActive)}
        >
          <Ellipsis className="size-5" />
          Ещё
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-xl pb-[env(safe-area-inset-bottom)]">
          <SheetHeader>
            <SheetTitle>Ещё</SheetTitle>
          </SheetHeader>
          <div className="space-y-1 px-2 pb-4">
            {MORE_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMoreOpen(false)}
                aria-current={isActive(pathname, href) ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium",
                  isActive(pathname, href) ? "bg-accent text-primary" : "hover:bg-accent",
                )}
              >
                <Icon className="size-[18px]" />
                {label}
              </Link>
            ))}
            <div className="flex items-center justify-between px-3 pt-2">
              <span className="text-sm text-muted-foreground">Тема</span>
              <ThemeToggle side="top" />
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-expense hover:bg-accent"
              >
                <LogOut className="size-[18px]" />
                Выйти
              </button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
