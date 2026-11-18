import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-border bg-foreground/5 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40",
        className,
      )}
      {...props}
    />
  );
}
