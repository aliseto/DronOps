import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type EmptyVariant = "first-use" | "filtered" | "good";

/**
 * The three distinct empty states (UX_SYSTEM §7), never confused:
 * first-use (explain + CTA), filtered (clear filters), good (celebrate — for
 * exception lists with nothing needing attention).
 */
export function EmptyState({
  variant = "first-use",
  title,
  description,
  action,
  className,
}: {
  variant?: EmptyVariant;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-default p-10 text-center",
        variant === "good" && "border-solid border-subtle",
        className,
      )}
    >
      <p className="text-heading font-semibold text-fg-primary">{title}</p>
      {description && <p className="max-w-md text-small text-fg-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
