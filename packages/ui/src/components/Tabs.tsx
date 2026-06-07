"use client";

import { useId, type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface TabItem {
  value: string;
  label: ReactNode;
}

/** Controlled tablist. Sub-areas within a module are tabs, never rail items. */
export function Tabs({
  items,
  value,
  onValueChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}) {
  const base = useId();
  return (
    <div role="tablist" className={cn("flex gap-1 border-b border-subtle", className)}>
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            id={`${base}-${item.value}`}
            aria-selected={selected}
            type="button"
            onClick={() => onValueChange(item.value)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-small transition-colors",
              selected
                ? "border-accent text-fg-primary"
                : "border-transparent text-fg-muted hover:text-fg-secondary",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
