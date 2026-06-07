"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Modal — confirmations and the signature ceremony only (DESIGN_SYSTEM §3);
 * never for viewing data (drawers exist). Confirm buttons name the action.
 */
export function Modal({
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

  useEffect(() => {
    if (!open) return;
    titleRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--overlay)]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-lg border border-default bg-surface shadow-[var(--shadow-raised)]"
      >
        <header className="border-b border-subtle px-4 py-3">
          <h2 ref={titleRef} tabIndex={-1} className="text-heading font-semibold text-fg-primary">
            {title}
          </h2>
        </header>
        <div className="p-4">{children}</div>
        {footer && (
          <footer className="flex justify-end gap-2 border-t border-subtle p-4">{footer}</footer>
        )}
      </div>
    </div>
  );
}
