import clsx from "clsx";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={clsx("rounded-card bg-surface p-5", className)} />;
}

export function Chip({
  active,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { active?: boolean }) {
  return (
    <span
      {...props}
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
        active ? "bg-accent-soft text-accent-text" : "bg-surface-2 text-muted",
        className,
      )}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={clsx("animate-pulse rounded-control bg-surface-2", className)} />
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  text?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border p-10 text-center">
      {icon && <div className="text-muted">{icon}</div>}
      <h2 className="text-lg font-bold">{title}</h2>
      {text && <p className="max-w-sm text-sm text-muted">{text}</p>}
      {action}
    </div>
  );
}
