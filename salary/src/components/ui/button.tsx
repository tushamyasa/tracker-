"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-emerald-500 text-slate-950 hover:bg-emerald-400",
        secondary: "border border-border bg-foreground/5 hover:bg-foreground/10",
        ghost: "hover:bg-foreground/10",
        destructive: "bg-rose-500 text-white hover:bg-rose-400",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ComponentProps<typeof motion.button>,
    VariantProps<typeof buttonVariants> {}

/** Кнопка с микроанимацией: лёгкое увеличение при наведении и сжатие при нажатии. */
export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
