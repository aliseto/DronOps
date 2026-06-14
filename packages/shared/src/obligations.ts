/**
 * P0 — the obligations model behind notifications and the exceptions-first
 * dashboard (UX_SYSTEM §1.3/§9). Obligations, not activity: every entry says
 * what is owed, when it is due, and links to the exact record. Severity is
 * derived state (no job): overdue when past due; due-soon inside the warning
 * window; otherwise open.
 */

export type ObligationSeverity = "overdue" | "due-soon" | "open";

export interface Obligation {
  /** Stable key for the row (kind + record id). */
  key: string;
  /** Vocabulary key, e.g. "ack_due", "occurrence_deadline" — UI label via i18n. */
  kind: string;
  /** What is owed, named after the object ("Acknowledge MAN-001 rev 2"). */
  title: string;
  /** Optional secondary line (clause, mission code, …). */
  detail?: string;
  /** When it is due; null = open-ended obligation. */
  dueAt: Date | null;
  severity: ObligationSeverity;
  /** Deep link to the exact record. */
  href: string;
}

export const DEFAULT_DUE_SOON_DAYS = 7;

/** Derived severity for a deadline-bearing obligation (overdue flag wins). */
export function obligationSeverity(
  dueAt: Date | null,
  now: Date = new Date(),
  dueSoonDays: number = DEFAULT_DUE_SOON_DAYS,
): ObligationSeverity {
  if (!dueAt) return "open";
  if (now.getTime() >= dueAt.getTime()) return "overdue";
  if (dueAt.getTime() - now.getTime() <= dueSoonDays * 86_400_000) return "due-soon";
  return "open";
}

const SEVERITY_RANK: Record<ObligationSeverity, number> = { overdue: 0, "due-soon": 1, open: 2 };

export interface GroupedObligations {
  overdue: Obligation[];
  dueSoon: Obligation[];
  open: Obligation[];
  total: number;
}

/** Most-urgent first within each group; earliest deadline first, undated last. */
export function groupObligations(items: Obligation[]): GroupedObligations {
  const sorted = [...items].sort((a, b) => {
    const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity);
  });
  return {
    overdue: sorted.filter((o) => o.severity === "overdue"),
    dueSoon: sorted.filter((o) => o.severity === "due-soon"),
    open: sorted.filter((o) => o.severity === "open"),
    total: sorted.length,
  };
}
