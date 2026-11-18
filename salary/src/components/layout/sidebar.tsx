"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="glass-bar fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r md:flex">
      <Link href="/dashboard" className="flex h-16 items-center gap-2.5 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/15 text-emerald-500">
          <Wallet className="h-5 w-5" />
        </span>
        <span className="text-lg font-bold tracking-tight">Salary</span>
      </Link>
      <nav className="flex flex-col gap-1 px-3 py-2" aria-label="Основная навигация">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
