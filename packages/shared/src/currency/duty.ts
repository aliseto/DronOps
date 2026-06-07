import { DUTY_SCHEMES, type DutySchemeRule } from "@dronops/content";
import type { Jurisdiction } from "../jurisdiction/engine";

/**
 * Duty / rest engine (DUOSAM OSO#17, UAE-Dubai). Pure functions over duty records
 * + a content scheme. The scheme's numeric values are an OPEN ITEM pending the
 * owner (DRO-REG-001 §16.2) — a configured scheme whose values are still pending
 * returns status "not-configured" rather than silently passing, so we never
 * assert compliance against limits we don't have. The breach logic itself is
 * fully implemented and tested against schemes with concrete values.
 *
 * Breaches feed the deviation→finding loop (M3) at projection/roster time; this
 * engine only computes them.
 */

const HOUR_MS = 3_600_000;

export interface DutyRecord {
  startAt: Date;
  endAt: Date;
}

export type DutyBreachKind =
  | "duty-hours-exceeded"
  | "insufficient-rest"
  | "consecutive-days-exceeded";

export interface DutyBreach {
  kind: DutyBreachKind;
  at: Date;
  limit: number;
  actual: number;
  detail: string;
}

export type DutyProjectionStatus = "ok" | "breach" | "not-configured" | "no-scheme";

export interface DutyProjection {
  status: DutyProjectionStatus;
  breaches: DutyBreach[];
  clause?: string;
}

const hours = (a: Date, b: Date) => (b.getTime() - a.getTime()) / HOUR_MS;
const sameUtcDay = (a: Date, b: Date) =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate();

/**
 * Project duty/rest breaches for one person's records under a scheme. Records
 * may be historical or planned (rostering warnings come from projecting planned
 * duty). Returns "not-configured" when the scheme exists but its values are still
 * pending transcription from source.
 */
export function dutyProjection(
  records: readonly DutyRecord[],
  scheme: DutySchemeRule | undefined,
): DutyProjection {
  if (!scheme) return { status: "no-scheme", breaches: [] };
  if (
    scheme.valuesPending ||
    scheme.maxDutyHoursPerPeriod == null ||
    scheme.dutyPeriodHours == null ||
    scheme.minRestHours == null ||
    scheme.maxConsecutiveDutyDays == null
  ) {
    return { status: "not-configured", breaches: [], clause: scheme.clause };
  }

  const sorted = [...records].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  const breaches: DutyBreach[] = [];

  for (const r of sorted) {
    const dutyHours = hours(r.startAt, r.endAt);
    if (dutyHours > scheme.maxDutyHoursPerPeriod) {
      breaches.push({
        kind: "duty-hours-exceeded",
        at: r.endAt,
        limit: scheme.maxDutyHoursPerPeriod,
        actual: Number(dutyHours.toFixed(2)),
        detail: `Duty ${dutyHours.toFixed(1)}h exceeds ${scheme.maxDutyHoursPerPeriod}h`,
      });
    }
  }

  for (let i = 1; i < sorted.length; i++) {
    const rest = hours(sorted[i - 1]!.endAt, sorted[i]!.startAt);
    if (rest < scheme.minRestHours) {
      breaches.push({
        kind: "insufficient-rest",
        at: sorted[i]!.startAt,
        limit: scheme.minRestHours,
        actual: Number(rest.toFixed(2)),
        detail: `Rest ${rest.toFixed(1)}h below ${scheme.minRestHours}h minimum`,
      });
    }
  }

  // Consecutive UTC duty days without a full off-day.
  let run = 0;
  let prevDay: Date | null = null;
  for (const r of sorted) {
    if (prevDay && sameUtcDay(prevDay, r.startAt)) continue; // same day, one run unit
    if (prevDay && hours(prevDay, r.startAt) <= 48 && !sameUtcDay(prevDay, r.startAt)) {
      const gapDays = Math.round(hours(prevDay, r.startAt) / 24);
      run = gapDays <= 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    if (run > scheme.maxConsecutiveDutyDays) {
      breaches.push({
        kind: "consecutive-days-exceeded",
        at: r.startAt,
        limit: scheme.maxConsecutiveDutyDays,
        actual: run,
        detail: `${run} consecutive duty days exceeds ${scheme.maxConsecutiveDutyDays}`,
      });
    }
    prevDay = r.startAt;
  }

  return { status: breaches.length > 0 ? "breach" : "ok", breaches, clause: scheme.clause };
}

/** Duty scheme for a jurisdiction (or undefined when the mode requires none). */
export function dutySchemeFor(jurisdiction: Jurisdiction): DutySchemeRule | undefined {
  return DUTY_SCHEMES[jurisdiction];
}
