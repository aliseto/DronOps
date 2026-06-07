import { capaRuleFor, type FindingLevel } from "@dronops/content";
import type { DeviationSeverity, FlightDeviation } from "../flight/engine";

/**
 * Compliance finding engine (M2) — turns the M6 deviation evidence into the
 * NCR/CAPA loop. Pure: finding level + CAPA due window come from content
 * (capaRuleFor), never hardcoded. The auto-raise itself (writing findings at
 * flight SEAL) lives in the server; this module is the deterministic policy.
 *
 * Lifecycle (lean, expandable to the AIR-PRD 7-state chain): the StatusPill `ncr`
 * vocab — open → containment → capa-in-progress → verify → closed, with
 * false-positive as a triage off-ramp. Segregation of duties (raiser ≠ closure
 * verifier, Hard Rule 4) is a DB trigger; sodViolation mirrors it for the UI.
 */

export type FindingStatus =
  | "open"
  | "containment"
  | "capa-in-progress"
  | "verify"
  | "closed"
  | "false-positive";

/** Triage of an auto-raised finding (C-04): accept, downgrade level, or dismiss. */
export type TriageDecision = "accept" | "downgrade" | "false-positive";

export { type FindingLevel };

/** Deviation severity → finding level (GCAA Level 1/2/3 ≈ major/minor/observation). */
export const DEVIATION_LEVEL: Record<DeviationSeverity, FindingLevel> = {
  high: "major",
  medium: "minor",
  low: "observation",
};

const DAY_MS = 86_400_000;

/** CAPA due date = raised + the jurisdiction's calendar-day window for the level. */
export function capaDueDate(jurisdiction: string, level: FindingLevel, raisedAt: Date): Date {
  const rule = capaRuleFor(jurisdiction);
  return new Date(raisedAt.getTime() + rule[level] * DAY_MS);
}

export interface AutoRaisedFinding {
  source: "flight_deviation";
  deviationCode: string;
  severity: DeviationSeverity;
  level: FindingLevel;
  title: string;
  description: string;
  clause: string | null;
  dueAt: Date;
}

/** Map one sealed-flight deviation to an auto-raised finding (untriaged, open). */
export function deviationToFinding(
  dev: FlightDeviation,
  jurisdiction: string,
  raisedAt: Date,
): AutoRaisedFinding {
  const level = DEVIATION_LEVEL[dev.severity];
  return {
    source: "flight_deviation",
    deviationCode: dev.code,
    severity: dev.severity,
    level,
    title: dev.detail,
    description: dev.detail,
    clause: dev.clause ?? null,
    dueAt: capaDueDate(jurisdiction, level, raisedAt),
  };
}

interface FindingTransition {
  from: FindingStatus;
  to: FindingStatus;
  label: string;
  /** Requires a verifier distinct from the raiser (SoD). */
  verifies?: boolean;
}

export const FINDING_TRANSITIONS: FindingTransition[] = [
  { from: "open", to: "containment", label: "Start containment" },
  { from: "open", to: "false-positive", label: "Mark false positive" },
  { from: "containment", to: "capa-in-progress", label: "Open CAPA" },
  { from: "capa-in-progress", to: "verify", label: "Submit for verification" },
  { from: "verify", to: "closed", label: "Verify & close", verifies: true },
  { from: "verify", to: "capa-in-progress", label: "Reopen CAPA" },
];

export function allowedFindingTransitions(from: FindingStatus): FindingTransition[] {
  return FINDING_TRANSITIONS.filter((t) => t.from === from);
}

export function findingTransition(from: FindingStatus, to: FindingStatus): FindingTransition | null {
  return FINDING_TRANSITIONS.find((t) => t.from === from && t.to === to) ?? null;
}

/** SoD guard (Hard Rule 4): the raiser cannot verify their own finding's closure. */
export function sodViolation(raiserPersonId: string | null, verifierPersonId: string | null): boolean {
  return raiserPersonId != null && verifierPersonId != null && raiserPersonId === verifierPersonId;
}

/** Apply a triage decision, returning the level/status patch (reason logged by caller). */
export function applyTriage(decision: TriageDecision, currentLevel: FindingLevel): {
  status?: FindingStatus;
  level: FindingLevel;
} {
  switch (decision) {
    case "false-positive":
      return { status: "false-positive", level: currentLevel };
    case "downgrade":
      return { level: "observation" };
    case "accept":
      return { level: currentLevel };
  }
}
