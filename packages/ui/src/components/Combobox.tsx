"use client";

import { useMemo, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface ComboItem {
  value: string;
  label: string;
  detail?: ReactNode;
}

/**
 * Type-ahead combobox (selects with >7 options become these, UX §4). Entity
 * pickers show identifying detail so users never pick blind.
 */
export function Combobox({
  items,
  value,
  onValueChange,
  placeholder = "Search…",
  className,
}: {
  items: ComboItem[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div className={cn("relative", className)}>
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls="combobox-list"
        value={open ? query : (selected?.label ?? "")}
        placeholder={placeholder}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="w-full rounded-md border border-default bg-inset px-3 py-2 text-body text-fg-primary placeholder:text-fg-muted focus-visible:border-focus"
      />
      {open && (
        <ul
          id="combobox-list"
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-default bg-raised py-1 shadow-[var(--shadow-raised)]"
        >
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-small text-fg-muted">No matches</li>
          )}
          {filtered.map((i) => (
            <li key={i.value} role="option" aria-selected={i.value === value}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onValueChange(i.value);
                  setQuery("");
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2 text-start text-small hover:bg-hover",
                  i.value === value ? "text-fg-primary" : "text-fg-secondary",
                )}
              >
                <span>{i.label}</span>
                {i.detail && <span className="text-micro text-fg-muted">{i.detail}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
