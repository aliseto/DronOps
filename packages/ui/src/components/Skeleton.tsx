import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

/** Loading placeholder. Pulses; static under prefers-reduced-motion. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-inset motion-reduce:animate-none", className)}
      {...props}
    />
  );
}
