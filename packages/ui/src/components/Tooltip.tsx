"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * Lightweight tooltip — info on hover AND focus (never hover-only, UX §14).
 * For brief regulatory citations etc. Not a substitute for visible labels.
 */
export function Tooltip({
  content,
  children,
  className,
}: {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span className={cn("relative inline-flex", className)}>
      <span
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        tabIndex={0}
        className="inline-flex"
      >
        {children}
      </span>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-default bg-raised px-2 py-1 text-micro text-fg-primary shadow-[var(--shadow-raised)]"
        >
          {content}
        </span>
      )}
    </span>
  );
}