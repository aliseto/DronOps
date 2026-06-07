import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-fg-on-accent hover:bg-accent-hover active:bg-accent-active",
  secondary: "border border-default bg-surface text-fg-primary hover:bg-hover",
  ghost: "text-fg-secondary hover:bg-hover",
  danger: "bg-status-danger-bg text-status-danger-fg hover:opacity-90",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-small",
  md: "h-9 px-4 text-body",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, type, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
});
