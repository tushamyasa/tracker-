import clsx from "clsx";
import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-muted">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        {...props}
        className={clsx(
          "min-h-11 rounded-control border bg-surface-2 px-3 text-base text-text placeholder:text-muted",
          error ? "border-danger" : "border-border",
          className,
        )}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
