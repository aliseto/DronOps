import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

/**
 * EvidenceChip (DESIGN_SYSTEM §4.2) — grade dot + label + mono hash tail.
 * Makes evidence grade legible at a glance so manual entry never masquerades
 * as telemetry-backed fact (UX §1: "evidence looks different from opinion").
 * Grade colors come from the --evidence-* tokens, both themes.
 */

export type EvidenceGrade = "telemetry" | "cloud" | "manual";

const GRADE: Record<EvidenceGrade, { dot: string; label: string }> = {
  telemetry: { dot: "bg-evidence-telemetry", label: "Telemetry" },
  cloud: { dot: "bg-evidence-cloud", label: "Cloud sync" },
  manual: { dot: "bg-evidence-manual", label: "Manual entry" },
};

/** Last 8 chars of a content hash, prefixed with an ellipsis. */
function hashTail(hash: string): string {
  const tail = hash.length > 8 ? hash.slice(-8) : hash;
  return `…${tail}`;
}

export interface EvidenceChipProps extends HTMLAttributes<HTMLSpanElement> {
  grade: EvidenceGrade;
  /** SHA-256 (or any content hash); only the tail is shown, in mono. */
  hash?: string;
  /** Override the default grade label. */
  label?: string;
}

export function EvidenceChip({ grade, hash, label, className, ...props }: EvidenceChipProps) {
  const g = GRADE[grade];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border border-subtle bg-inset px-2 py-0.5 text-micro text-fg-secondary",
        className,
      )}
      {...props}
    >
      <span className={cn("size-1.5 shrink-0 rounded-pill", g.dot)} aria-hidden />
      <span>{label ?? g.label}</span>
      {hash && (
        <span className="font-mono text-fg-muted tabular-nums" title={hash}>
          {hashTail(hash)}
        </span>
      )}
    </span>
  );
}
