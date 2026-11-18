"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";
import { QuickAddButton } from "./quick-add";

// Мобильная панель: 4 раздела + центральная кнопка [+]
const ITEMS = NAV_ITEMS.filter((i) => i.href !== "/analytics");

export function BottomNav() {
  const pathname = usePathname();
  const left = ITEMS.slice(0, 2);
  const right = ITEMS.slice(2);

  const renderLink = ({ href, label, icon: Icon }: (typeof ITEMS)[number]) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex flex-1 flex-col items-center gap-0.5 py-1 text-[11px] font-medium",
          active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
        {label}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Основная навигация"
      className="glass-bar fixed inset-x-3 bottom-3 z-30 flex items-center rounded-md border px-2 py-1.5 shadow-lg md:hidden"
    >
      {left.map(renderLink)}
      <div className="flex flex-1 justify-center">
        <QuickAddButton className="-mt-6 h-12 w-12" />
      </div>
      {right.map(renderLink)}
    </nav>
  );
}
