import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * Stat (DESIGN_SYSTEM §3, §5) — a dashboard KPI: label + value + optional
 * unit and hint. The value is mono/tabular so figures align in a stat row
 * (dashboards read stats → exceptions → trends). The hint is where the system
 * speaks plainly about itself (UX §13: "Computed 6 minutes ago").
 */

export type StatTone = "default" | "ok" | "warn" | "danger";

const toneClass: Record<StatTone, string> = {
  default: "text-fg-primary",
  ok: "text-status-ok-fg",
  warn: "text-status-warn-fg",
  danger: "text-status-danger-fg",
};

export interface StatProps {
  label: string;
  value: ReactNode;
  /** Unit suffix shown next to the value, e.g. "missions", "h". */
  unit?: string;
  /** Sub-line: provenance or freshness ("Computed 6 min ago"). */
  hint?: ReactNode;
  tone?: StatTone;
  className?: string;
}

export function Stat({ label, value, unit, hint, tone = "default", className }: StatProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-micro text-fg-muted">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className={cn("font-mono text-title tabular-nums", toneClass[tone])}>{value}</span>
        {unit && <span className="text-small text-fg-muted">{unit}</span>}
      </span>
      {hint && <span className="text-micro text-fg-muted">{hint}</span>}
    </div>
  );
}
