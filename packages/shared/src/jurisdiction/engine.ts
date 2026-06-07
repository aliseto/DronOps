import {
  OCCURRENCE_DEADLINES,
  RETENTION,
  CAPA_DEFAULTS,
  FLIGHT_COMPLETENESS,
  RECENCY_GATES,
  REGISTRATION_GATES,
  type OccurrenceDeadlineRule,
  type CapaRule,
  type FindingLevel,
  type FlightField,
  type RecencyRule,
  type RegistrationRule,
} from "@dronops/content";

/**
 * Jurisdiction engine — pure functions that read content rule data. NO regulator
 * value is embedded here; everything comes from @dronops/content (BUILD_PLAN §1).
 */

export type Jurisdiction = "UAE-Federal" | "UAE-Dubai" | "KSA" | "ISO";

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

function addMonthsUTC(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  const targetMonth = d.getUTCMonth() + months;
  const day = d.getUTCDate();
  d.setUTCMonth(targetMonth, 1); // avoid month overflow (e.g. Jan 31 + 1)
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

// ---------------------------------------------------------------- deadlines
export interface DeadlineResult {
  dueAt: Date;
  rule: OccurrenceDeadlineRule;
}

/** Reporting deadline for an occurrence, bound by its jurisdiction (§6). */
export function deadlineFor(
  record: { occurredAt: Date },
  jurisdiction: Jurisdiction,
): DeadlineResult | null {
  const rule = OCCURRENCE_DEADLINES[jurisdiction];
  if (!rule) return null;
  const ms = rule.unit === "hours" ? rule.value * HOUR_MS : rule.value * DAY_MS;
  return { dueAt: new Date(record.occurredAt.getTime() + ms), rule };
}

/** CAPA due date for a finding by level + jurisdiction (§12). */
export function capaDeadlineFor(
  finding: { raisedAt: Date; level: FindingLevel },
  jurisdiction: Jurisdiction,
): { dueAt: Date; days: number; rule: CapaRule } | null {
  const rule = CAPA_DEFAULTS[jurisdiction];
  if (!rule) return null;
  const days = rule[finding.level];
  return { dueAt: new Date(finding.raisedAt.getTime() + days * DAY_MS), days, rule };
}

// ---------------------------------------------------------------- retention
export interface RetentionResult {
  retainUntil: Date;
  months: number;
  basis: "default" | "personnel-employment-end";
  clause: string;
}

/**
 * Retain-until for a record (§4 + §15.1). Default = creation + 36 months;
 * personnel records run until employment-end + 36 months when UAE-Dubai is
 * enabled. Display/blocking metadata only — never triggers deletion.
 */
export function retentionFor(
  record: { type: string; createdAt: Date; employmentEndAt?: Date | null },
  opts: { enabledJurisdictions?: readonly string[] } = {},
): RetentionResult {
  const enabled = new Set(opts.enabledJurisdictions ?? []);
  const personnelRule = RETENTION.personnelEmploymentEnd["UAE-Dubai"];
  if (
    record.type === "personnel_record" &&
    enabled.has("UAE-Dubai") &&
    record.employmentEndAt
  ) {
    return {
      retainUntil: addMonthsUTC(record.employmentEndAt, personnelRule.months),
      months: personnelRule.months,
      basis: "personnel-employment-end",
      clause: personnelRule.clause,
    };
  }
  return {
    retainUntil: addMonthsUTC(record.createdAt, RETENTION.defaultMonths),
    months: RETENTION.defaultMonths,
    basis: "default",
    clause: RETENTION.clause,
  };
}

// --------------------------------------------------------------- completeness
export interface CompletenessResult {
  complete: boolean;
  missing: FlightField[];
  required: FlightField[];
}

const isEmpty = (v: unknown): boolean =>
  v == null || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0);

/** Jurisdiction-aware required-field check for a flight record (§5). */
export function completenessFor(
  flight: Partial<Record<FlightField, unknown>>,
  jurisdiction: Jurisdiction,
): CompletenessResult {
  const required = FLIGHT_COMPLETENESS[jurisdiction] ?? [];
  const missing = required.filter((f) => isEmpty(flight[f]));
  return { complete: missing.length === 0, missing, required };
}

// ------------------------------------------------------------------- gates
export type GateRule =
  | { type: "recency"; rule: RecencyRule }
  | { type: "registration"; rule: RegistrationRule };

/** Gate rules that apply to a mission by jurisdiction (§7–8). */
export function gatesFor(mission: { jurisdiction: Jurisdiction }): GateRule[] {
  const gates: GateRule[] = [];
  const recency = RECENCY_GATES[mission.jurisdiction];
  if (recency) gates.push({ type: "recency", rule: recency });
  const registration = REGISTRATION_GATES[mission.jurisdiction];
  if (registration) gates.push({ type: "registration", rule: registration });
  return gates;
}
