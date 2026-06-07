import { DUTY_SCHEMES, maxDutyMinutes, type DutySchemeRule } from "@dronops/content";
import type { Jurisdiction } from "../jurisdiction/engine";

/**
 * Duty / rest engine — DUOSAM OSO#17 (DCAR-UAS), values v1.4. Pure functions over
 * duty records + the content scheme. OSO#17 binds to SPECIFIC-CATEGORY Dubai ops,
 * so applicability is an explicit input — never inferred from jurisdiction alone:
 *
 *   - not-applicable : the person isn't covered (open-category-only Dubai). A
 *                      truthful "doesn't apply" — never amber, never a breach.
 *   - no-scheme      : no duty scheme in the enabled jurisdictions.
 *   - ok / breach    : live evaluation of the four OSO#17 behaviours.
 *
 * Four behaviours (source v1.4):
 *   1. Duty/day ≤ base − extraAreas×reduction  (780 − 60·areas).
 *   2. Block time/day ≤ 240 min — block time accrues from M6 flight records;
 *      until M6 exists this rule reports `blockTime: "awaiting-m6"`, never a pass.
 *   3. Rest before next duty ≥ max(last-duty-duration, 480 min floor).
 *   4. ≥1 full day off in any rolling 7-day window.
 *
 * Breaches feed the deviation→finding loop (M3); this engine only computes them.
 */

const MIN_MS = 60_000;

export interface DutyRecord {
  startAt: Date;
  endAt: Date;
  /** Additional flight areas beyond the first (drives the duty-minutes reduction). */
  extraFlightAreas?: number;
}

export type DutyBreachKind =
  | "duty-minutes-exceeded"
  | "insufficient-rest"
  | "no-weekly-day-off";

export interface DutyBreach {
  kind: DutyBreachKind;
  at: Date;
  limit: number;
  actual: number;
  detail: string;
}

export type DutyProjectionStatus = "ok" | "breach" | "not-applicable" | "no-scheme";

/** Block-time rule state: it can only evaluate once M6 supplies flight block time. */
export type BlockTimeStatus = "awaiting-m6" | "ok" | "breach";

export interface DutyProjection {
  status: DutyProjectionStatus;
  breaches: DutyBreach[];
  /** Block-time (240 min/day) rule — "awaiting-m6" until flight records exist. */
  blockTime: BlockTimeStatus;
  clause?: string;
}

const minutes = (a: Date, b: Date) => (b.getTime() - a.getTime()) / MIN_MS;
const utcDayKey = (d: Date) => Math.floor(d.getTime() / 86_400_000); // UTC day index

/**
 * Project duty/rest breaches for one person's records under a scheme.
 *
 * `opts.applicable` gates coverage: pass `false` for a pilot OSO#17 doesn't cover
 * (open-category-only) → "not-applicable" (never amber). Default true so the
 * breach logic stays directly testable.
 */
export function dutyProjection(
  records: readonly DutyRecord[],
  scheme: DutySchemeRule | undefined,
  opts: { applicable?: boolean } = {},
): DutyProjection {
  if (opts.applicable === false) {
    return { status: "not-applicable", breaches: [], blockTime: "awaiting-m6", clause: scheme?.clause };
  }
  if (!scheme) return { status: "no-scheme", breaches: [], blockTime: "awaiting-m6" };

  const sorted = [...records].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  const breaches: DutyBreach[] = [];

  // 1. Duty minutes per record ≤ base − extraAreas × reduction.
  for (const r of sorted) {
    const dutyMin = minutes(r.startAt, r.endAt);
    const limit = maxDutyMinutes(scheme, r.extraFlightAreas ?? 0);
    if (dutyMin > limit) {
      breaches.push({
        kind: "duty-minutes-exceeded",
        at: r.endAt,
        limit,
        actual: Math.round(dutyMin),
        detail: `Duty ${Math.round(dutyMin)} min exceeds ${limit} min (${r.extraFlightAreas ?? 0} extra area(s))`,
      });
    }
  }

  // 3. Rest before next duty ≥ max(last-duty-duration, floor).
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const cur = sorted[i]!;
    const rest = minutes(prev.endAt, cur.startAt);
    const required = Math.max(minutes(prev.startAt, prev.endAt), scheme.minRestMinutesFloor);
    if (rest < required) {
      breaches.push({
        kind: "insufficient-rest",
        at: cur.startAt,
        limit: Math.round(required),
        actual: Math.round(rest),
        detail: `Rest ${Math.round(rest)} min below required ${Math.round(required)} min (≥ last duty, floor ${scheme.minRestMinutesFloor})`,
      });
    }
  }

  // 4. ≥1 full day off in any rolling 7-day window ⟺ no 7 consecutive duty-days.
  const dutyDays = [...new Set(sorted.map((r) => utcDayKey(r.startAt)))].sort((a, b) => a - b);
  let run = 0;
  for (let i = 0; i < dutyDays.length; i++) {
    run = i > 0 && dutyDays[i]! - dutyDays[i - 1]! === 1 ? run + 1 : 1;
    if (run >= 7) {
      breaches.push({
        kind: "no-weekly-day-off",
        at: new Date(dutyDays[i]! * 86_400_000),
        limit: scheme.minDaysOffPer7d,
        actual: 0,
        detail: `7 consecutive duty days — no full day off in the 7-day window`,
      });
      break;
    }
  }

  return {
    status: breaches.length > 0 ? "breach" : "ok",
    breaches,
    blockTime: "awaiting-m6", // block time sourced from M6 flight records
    clause: scheme.clause,
  };
}

/** Duty scheme for a jurisdiction (or undefined when the mode requires none). */
export function dutySchemeFor(jurisdiction: Jurisdiction): DutySchemeRule | undefined {
  return DUTY_SCHEMES[jurisdiction];
}
