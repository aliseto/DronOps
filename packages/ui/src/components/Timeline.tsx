import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface TimelineEvent {
  id: string;
  action: string;
  actor?: string | null;
  /** ISO string or formatted time; rendered in mono. */
  at: string;
  summary?: ReactNode;
}

/** Audit trail rendering (DESIGN_SYSTEM §3). Newest first is the caller's choice. */
export function Timeline({ events, className }: { events: TimelineEvent[]; className?: string }) {
  if (events.length === 0) {
    return <p className="text-small text-fg-muted">No history yet.</p>;
  }
  return (
    <ol className={cn("relative flex flex-col gap-4 ps-4", className)}>
      <span className="absolute inset-y-1 start-1 w-px bg-subtle" aria-hidden />
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span
            className="absolute -start-3 top-1 h-2 w-2 rounded-pill bg-accent"
            aria-hidden
          />
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-small font-medium text-fg-primary">{e.action}</span>
            <time className="font-mono text-micro text-fg-muted tabular-nums">{e.at}</time>
          </div>
          {(e.actor || e.summary) && (
            <p className="text-micro text-fg-muted">
              {e.actor && <span>{e.actor}</span>}
              {e.actor && e.summary ? " · " : ""}
              {e.summary}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
