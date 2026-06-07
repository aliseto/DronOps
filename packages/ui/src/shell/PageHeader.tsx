import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface Crumb {
  label: string;
  href?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-subtle px-6 py-4", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-1 text-micro text-fg-muted">
          {breadcrumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden>/</span>}
              {c.href ? (
                <a href={c.href} className="hover:text-fg-secondary">
                  {c.label}
                </a>
              ) : (
                <span>{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-title font-semibold text-fg-primary">{title}</h1>
          {description && <p className="mt-1 text-small text-fg-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
