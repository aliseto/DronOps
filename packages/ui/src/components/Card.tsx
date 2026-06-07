import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  actions?: ReactNode;
}

export function Card({ title, actions, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-lg border border-default bg-surface", className)}
      {...props}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
          {title ? <h3 className="text-heading font-semibold text-fg-primary">{title}</h3> : <span />}
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
