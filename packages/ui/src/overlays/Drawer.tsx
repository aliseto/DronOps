"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * End-side drawer — the primary detail surface (DESIGN_SYSTEM §3). Esc closes
 * (host handles dirty-check); focus moves to the title on open. URL-addressing
 * (?panel=…) is the caller's responsibility.
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);

  // §15 release hook: focus moves to the drawer on open and RETURNS to the
  // originating element on close/unmount. Keyed on `open` only so parent
  // re-renders (new onClose identity) never thrash focus.
  useEffect(() => {
    if (!open) return;
    returnFocusTo.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    titleRef.current?.focus();
    return () => {
      returnFocusTo.current?.focus();
      returnFocusTo.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-[var(--overlay)] motion-safe:transition-opacity"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        className="relative flex h-full w-full max-w-md flex-col border-s border-default bg-surface shadow-[var(--shadow-raised)]"
      >
        <header className="flex items-center justify-between border-b border-subtle px-4 py-3">
          <h2 ref={titleRef} tabIndex={-1} className="text-heading font-semibold text-fg-primary">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-fg-muted hover:bg-hover"
          >
            ×
          </button>
        </header>
        <div className={cn("flex-1 overflow-y-auto p-4")}>{children}</div>
        {footer && <footer className="border-t border-subtle p-4">{footer}</footer>}
      </aside>
    </div>
  );
}
