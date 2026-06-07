import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon buttons must have an accessible name. */
  label: string;
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, className, type, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-secondary",
        "transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
