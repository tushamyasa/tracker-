"use client";

import clsx from "clsx";
import { BarChart3, Dumbbell, History, Home, Plus, User } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeLangSwitch } from "./ThemeLangSwitch";

const items = [
  { href: "/", key: "home", icon: Home },
  { href: "/workouts", key: "workouts", icon: History },
  { href: "/exercises", key: "exercises", icon: Dumbbell },
  { href: "/progress", key: "progress", icon: BarChart3 },
  { href: "/profile", key: "profile", icon: User },
] as const;

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
}

export function BottomNav() {
  const t = useTranslations("nav");
  const isActive = useIsActive();
  return (
    <>
      <Link
        href="/workout/active"
        aria-label={t("start")}
        className="fixed bottom-[88px] right-4 z-30 grid size-14 place-items-center rounded-full bg-accent text-white shadow-lg lg:hidden"
      >
        <Plus className="size-6" aria-hidden />
      </Link>
      <nav
        aria-label={t("label")}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="grid h-16 grid-cols-5">
          {items.map(({ href, key, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={clsx(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-xs font-medium",
                  isActive(href) ? "text-accent-text" : "text-muted",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {t(key)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

export function Sidebar() {
  const t = useTranslations("nav");
  const a = useTranslations("app");
  const isActive = useIsActive();
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-6 border-r border-border bg-bg p-4 lg:flex">
      <div className="px-2 pt-2 font-heading text-lg font-extrabold">{a("name")}</div>
      <Link
        href="/workout/active"
        className="flex min-h-11 items-center justify-center gap-2 rounded-control bg-accent px-4 text-sm font-semibold text-white"
      >
        <Plus className="size-4" aria-hidden />
        {t("start")}
      </Link>
      <nav aria-label={t("label")}>
        <ul className="flex flex-col gap-1">
          {items.map(({ href, key, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={clsx(
                  "flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-medium",
                  isActive(href)
                    ? "bg-accent-soft text-accent-text"
                    : "text-muted hover:bg-surface-2",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {t(key)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto">
        <ThemeLangSwitch />
      </div>
    </aside>
  );
}
