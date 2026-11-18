import { BarChart3, LayoutDashboard, ReceiptText, Settings, Tags, type LucideIcon } from "lucide-react";

export const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/transactions", label: "Транзакции", icon: ReceiptText },
  { href: "/categories", label: "Категории", icon: Tags },
  { href: "/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/settings", label: "Настройки", icon: Settings },
];
