import { LogOut } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { logoutAction } from "@/server/actions/auth";

export function UserMenuSkeleton() {
  return <Skeleton className="size-8 rounded-full" />;
}

/** Серверный компонент: читает сессию, поэтому всегда оборачивается в <Suspense>. */
export async function UserMenu() {
  const session = await auth();
  const email = session?.user?.email ?? "";
  const initial = email.charAt(0).toUpperCase() || "?";

  return (
    <div className="flex items-center gap-2 lg:min-w-0 lg:flex-1">
      <div
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary"
        title={email}
      >
        {initial}
      </div>
      <span className="hidden min-w-0 flex-1 truncate text-sm text-muted-foreground lg:block">
        {email}
      </span>
      <form action={logoutAction} className="lg:ml-auto">
        <Button type="submit" variant="ghost" size="icon" aria-label="Выйти" title="Выйти">
          <LogOut className="size-4" />
        </Button>
      </form>
    </div>
  );
}
