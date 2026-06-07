import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type BadgeTone = "neutral" | "accent" | "external";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-inset text-fg-secondary",
  accent: "bg-accent-subtle text-accent",
  external: "border border-context-external text-context-external",
};

/**
 * Generic count/label badge. NOT for status — use StatusPill for any record
 * state so status styling has a single source.
 */
export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2 py-0.5 text-micro font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
