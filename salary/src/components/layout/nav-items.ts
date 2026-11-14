import {
  ArrowLeftRight,
  ChartColumn,
  LayoutDashboard,
  Settings,
  Tags,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/transactions", label: "Операции", icon: ArrowLeftRight },
  { href: "/categories", label: "Категории", icon: Tags },
  { href: "/reports", label: "Отчёты", icon: ChartColumn },
  { href: "/settings", label: "Настройки", icon: Settings },
];

/** Пункты, которые на телефоне уходят в меню «Ещё». */
export const MORE_HREFS = ["/reports", "/settings"] as const;

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function titleFor(pathname: string): string {
  return NAV_ITEMS.find((i) => isActive(pathname, i.href))?.label ?? "Salary";
}
