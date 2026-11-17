"use client";

import * as RTabs from "@radix-ui/react-tabs";
import clsx from "clsx";

export interface TabItem {
  value: string;
  label: string;
  content: React.ReactNode;
}

export function Tabs({ items, defaultValue }: { items: TabItem[]; defaultValue?: string }) {
  return (
    <RTabs.Root defaultValue={defaultValue ?? items[0]?.value}>
      <RTabs.List className="inline-flex gap-1 rounded-control bg-surface-2 p-1">
        {items.map((i) => (
          <RTabs.Trigger
            key={i.value}
            value={i.value}
            className={clsx(
              "min-h-9 rounded-[10px] px-4 text-sm font-semibold text-muted transition",
              "data-[state=active]:bg-bg data-[state=active]:text-text",
            )}
          >
            {i.label}
          </RTabs.Trigger>
        ))}
      </RTabs.List>
      {items.map((i) => (
        <RTabs.Content key={i.value} value={i.value} className="pt-4">
          {i.content}
        </RTabs.Content>
      ))}
    </RTabs.Root>
  );
}
