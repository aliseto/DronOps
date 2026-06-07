import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const fieldBase =
  "w-full rounded-md border border-default bg-inset px-3 py-2 text-body text-fg-primary " +
  "placeholder:text-fg-muted focus-visible:border-focus disabled:opacity-50";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Render value in mono with tabular figures (ids, serials, counters). */
  mono?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, mono, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(fieldBase, mono && "font-mono tabular-nums", className)}
      {...props}
    />
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  mono?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, mono, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(fieldBase, "min-h-20", mono && "font-mono tabular-nums", className)}
      {...props}
    />
  );
});
