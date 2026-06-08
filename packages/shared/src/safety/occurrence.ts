import { deadlineFor, type Jurisdiction } from "../jurisdiction/engine";

/**
 * M3 Safety occurrence engine — the FIRST consumer of the dormant jurisdiction
 * occurrence-deadline clock (DRO-REG §6 / §14, content OCCURRENCE_DEADLINES).
 * Pure: wraps `deadlineFor` and layers the reporting-status semantics the UI and
 * triage queue need — applicability, the immediate/overdue/satisfied states, the
 * countdown, and Oman's two-tier (immediate accident + 3-day listed) handling.
 *
 * Classification drives applicability: a hazard OBSERVATION is internal-only and
 * carries no regulator clock; an incident/accident binds the jurisdiction
 * deadline to its `occurredAt`. The clock is satisfied the moment the regulator
 * notification is recorded.
 */
export type OccurrenceClass = "incident" | "accident" | "hazard_observation";

export const OCCURRENCE_CLASSES: readonly OccurrenceClass[] = ["incident", "accident", "hazard_observation"];

export interface OccurrenceDeadlineInput {
  classification: OccurrenceClass;
  occurredAt: Date;
  /** When the regulator notification was made; null = not yet reported. */
  reportedToRegulatorAt: Date | null;
}

export interface OccurrenceDeadlineStatus {
  /** False for hazard observations (no external reporting clock). */
  applicable: boolean;
  /** Report-immediately rule (Oman accident): due on occurrence, not a window. */
  immediate: boolean;
  contacts: string | null;
  clause: string | null;
  appliesTo: string | null;
  dueAt: Date | null;
  satisfied: boolean;
  overdue: boolean;
  /** ms until due (negative once overdue); null when satisfied or n/a. */
  remainingMs: number | null;
  /** Oman second tier: listed incidents within 3 calendar days. */
  listed: { dueAt: Date; clause: string } | null;
}

const NA: OccurrenceDeadlineStatus = {
  applicable: false,
  immediate: false,
  contacts: null,
  clause: null,
  appliesTo: null,
  dueAt: null,
  satisfied: false,
  overdue: false,
  remainingMs: null,
  listed: null,
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function occurrenceDeadlineStatus(
  rec: OccurrenceDeadlineInput,
  jurisdiction: Jurisdiction,
  now: Date,
): OccurrenceDeadlineStatus {
  // Hazard observations are internal-only — no regulator clock.
  if (rec.classification === "hazard_observation") return { ...NA };

  const dl = deadlineFor({ occurredAt: rec.occurredAt }, jurisdiction);
  if (!dl) return { ...NA }; // jurisdiction defines no occurrence rule

  const { dueAt, rule } = dl;
  const satisfied = rec.reportedToRegulatorAt != null;
  const overdue = !satisfied && now.getTime() > dueAt.getTime();
  const listed = rule.listed
    ? { dueAt: new Date(rec.occurredAt.getTime() + rule.listed.value * DAY_MS), clause: rule.listed.clause }
    : null;

  return {
    applicable: true,
    immediate: rule.immediate === true,
    contacts: rule.contacts ?? null,
    clause: rule.clause,
    appliesTo: rule.appliesTo ?? null,
    dueAt,
    satisfied,
    overdue,
    remainingMs: satisfied ? null : dueAt.getTime() - now.getTime(),
    listed,
  };
}
