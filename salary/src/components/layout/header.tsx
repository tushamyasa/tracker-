import { LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { QuickAddButton } from "./quick-add";

export function Header({ name, email }: { name?: string | null; email?: string | null }) {
  const initial = (name || email || "?").charAt(0).toUpperCase();
  return (
    <header className="glass-bar sticky top-0 z-20 flex h-16 items-center justify-end gap-2 border-b px-4 md:px-6">
      <QuickAddButton className="mr-auto hidden h-9 gap-2 px-3 text-sm font-medium md:flex" />
      <ThemeToggle />
      <div className="flex items-center gap-2 pl-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/15 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          {initial}
        </span>
        <div className="hidden leading-tight sm:block">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
      </div>
      <form action={logoutAction}>
        <Button variant="ghost" size="icon" aria-label="Выйти" title="Выйти">
          <LogOut className="h-4 w-4" />
        </Button>
      </form>
    </header>
  );
}
