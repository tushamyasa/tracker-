"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActive } from "./nav-items";
import { ThemeToggle } from "./theme-toggle";

/**
 * Десктоп ≥1024: 240px с подписями. Планшет 768–1023: 64px, только иконки.
 * На телефоне скрыт (там нижняя навигация).
 */
export function Sidebar({ footer }: { footer: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-16 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex lg:w-60">
      <div className="flex h-14 items-center justify-center border-b lg:justify-start lg:px-5">
        <span className="text-lg font-semibold tracking-tight">
          <span className="text-primary">S</span>
          <span className="hidden lg:inline">
            <span className="text-primary">al</span>ary
          </span>
        </span>
      </div>

      <nav aria-label="Основная навигация" className="flex-1 space-y-1 p-2 lg:p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center justify-center gap-3 rounded-md text-sm font-medium transition-colors lg:justify-start lg:px-3",
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              <span className="hidden lg:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-2 border-t p-2 lg:flex-row-reverse lg:p-3">
        <ThemeToggle />
        {footer}
      </div>
    </aside>
  );
}
