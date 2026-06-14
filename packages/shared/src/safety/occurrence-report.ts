import { OCCURRENCE_DEADLINES } from "@dronops/content";
import type { Jurisdiction } from "../jurisdiction/engine";

/**
 * M3 Safety — per-jurisdiction occurrence-report metadata (S-06). Pure: reads the
 * occurrence-deadline content (DRO-REG §6 / §14) to produce the regulator-facing
 * header for an exported occurrence report — the responsible authority, the legal
 * clause, the reporting timeframe in words, and (Oman) the immediate-report
 * contacts plus the listed-incident second tier. The authority label itself is
 * content (`JURISDICTIONS[j].authority`) passed in by the caller.
 *
 * This is the "format per jurisdiction" of S-06: one report template whose
 * legal header is bound to the record's jurisdiction, never hardcoded.
 */
export interface OccurrenceReportMeta {
  authority: string;
  clause: string | null;
  /** Reporting timeframe in words, e.g. "Within 3 hours" / "Immediately". */
  timeframe: string;
  immediate: boolean;
  contacts: string | null;
  /** Oman second tier: listed incidents (e.g. "Within 3 calendar days"). */
  listedTimeframe: string | null;
}

function timeframe(value: number, unit: "hours" | "calendar-days", immediate: boolean): string {
  if (immediate || value === 0) return "Immediately";
  const noun = unit === "hours" ? "hour" : "calendar day";
  return `Within ${value} ${noun}${value === 1 ? "" : "s"}`;
}

export function occurrenceReportMeta(jurisdiction: Jurisdiction, authority: string): OccurrenceReportMeta {
  const rule = OCCURRENCE_DEADLINES[jurisdiction];
  if (!rule) {
    return { authority, clause: null, timeframe: "Per applicable regulation", immediate: false, contacts: null, listedTimeframe: null };
  }
  return {
    authority,
    clause: rule.clause,
    timeframe: timeframe(rule.value, rule.unit, rule.immediate === true),
    immediate: rule.immediate === true,
    contacts: rule.contacts ?? null,
    listedTimeframe: rule.listed ? timeframe(rule.listed.value, rule.listed.unit, false) : null,
  };
}
