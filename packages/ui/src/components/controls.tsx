import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";

type BaseProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label?: ReactNode };

export const Checkbox = forwardRef<HTMLInputElement, BaseProps>(function Checkbox(
  { label, className, ...props },
  ref,
) {
  return (
    <label className="inline-flex items-center gap-2 text-small text-fg-secondary">
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border-default text-accent accent-[var(--accent)]",
          className,
        )}
        {...props}
      />
      {label}
    </label>
  );
});

export const Radio = forwardRef<HTMLInputElement, BaseProps>(function Radio(
  { label, className, ...props },
  ref,
) {
  return (
    <label className="inline-flex items-center gap-2 text-small text-fg-secondary">
      <input
        ref={ref}
        type="radio"
        className={cn("h-4 w-4 border-default accent-[var(--accent)]", className)}
        {...props}
      />
      {label}
    </label>
  );
});

/** Accessible switch built on a checkbox input. */
export const Switch = forwardRef<HTMLInputElement, BaseProps>(function Switch(
  { label, className, ...props },
  ref,
) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-small text-fg-secondary">
      <span className="relative inline-flex">
        <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
        <span className="h-5 w-9 rounded-pill bg-strong transition-colors peer-checked:bg-accent" />
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-4 w-4 rounded-pill bg-surface transition-transform peer-checked:translate-x-4",
            className,
          )}
        />
      </span>
      {label}
    </label>
  );
});
