"use client";

import { useId, type ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * Label + control + help/error wrapper. Error text says how to fix, not just
 * what's wrong (UX_SYSTEM §4). Associates label/help/error to the control via
 * ids passed through render-prop.
 */
export function FormField({
  label,
  required,
  help,
  error,
  className,
  children,
}: {
  label: ReactNode;
  required?: boolean;
  help?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: (ids: { id: string; describedBy?: string }) => ReactNode;
}) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy = [help ? helpId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={id} className="text-small text-fg-secondary">
        {label}
        {required && <span className="ms-0.5 text-status-danger-fg">*</span>}
      </label>
      {children({ id, describedBy: describedBy || undefined })}
      {help && !error && (
        <p id={helpId} className="text-micro text-fg-muted">
          {help}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-micro text-status-danger-fg">
          {error}
        </p>
      )}
    </div>
  );
}