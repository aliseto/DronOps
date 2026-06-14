import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

/**
 * Tag (DESIGN_SYSTEM §3) — a categorical label, optionally removable.
 * Distinct from Badge (a count/label) and from StatusPill (record state):
 * Tags carry classifications and filter chips (UX §3 "filters are chips").
 * Never use Tag for record status — that is StatusPill's job.
 */
export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  /** When provided, renders a remove affordance; copy is for the a11y label. */
  onRemove?: () => void;
  /** Accessible label for the remove button, e.g. "Remove KSA filter". */
  removeLabel?: string;
}

export function Tag({ children, onRemove, removeLabel, className, ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill border border-default bg-surface px-2 py-0.5 text-micro text-fg-secondary",
        className,
      )}
      {...props}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel ?? "Remove"}
          className="-me-0.5 inline-flex size-3.5 items-center justify-center rounded-pill text-fg-muted transition-colors hover:bg-hover hover:text-fg-primary"
        >
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </span>
  );
}
