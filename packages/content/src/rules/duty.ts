import { z } from "zod";
import { type JURISDICTION_KEYS } from "../jurisdictions";

type Jurisdiction = (typeof JURISDICTION_KEYS)[number];

/**
 * Duty / rest scheme rule data — DUOSAM OSO#17 (DCAR-UAS), extracted from source
 * v1.4 (docs/dronops_duty_rules_oso17_v1.4.sql). The duty engine in
 * @dronops/shared reads these; no value is embedded in the engine.
 *
 * Scope: applies ONLY to UAE-Dubai SPECIFIC-CATEGORY operations
 * (`appliesWhenRiskTier: "high"`). A standard/open-category Dubai operation does
 * not invoke OSO#17 — its duty card stays "not applicable".
 *
 * Duty values are MAXIMA, rest values are MINIMA; company/collective agreements
 * may only TIGHTEN them, never extend. (Self-declaration of fitness is a
 * pre-commencement checklist item on specific-category missions — M4.)
 */
const schemeSchema = z.object({
  jurisdiction: z.literal("UAE-Dubai"),
  objective: z.literal("OSO#17"),
  /** Specific-category only — the risk_tier the scheme binds to (re-tag v1.3). */
  appliesWhenRiskTier: z.literal("high"),
  clause: z.string().min(1),
  /** Max flight-duty per day, all crew (13 h). */
  maxDutyMinutesBase: z.number().int().positive(),
  /** −1 h of allowable duty per ADDITIONAL flight area. */
  dutyReductionPerExtraAreaMinutes: z.number().int().nonnegative(),
  /** Max flight/block time per day, remote pilots (4 h) — sourced from M6. */
  maxFlightBlockMinutesPerDay: z.number().int().positive(),
  /** Absolute rest floor between duties (8 h). */
  minRestMinutesFloor: z.number().int().positive(),
  /** Rest must be ≥ the duration of the last duty period (but never below the floor). */
  minRestRule: z.literal("ge_last_duty"),
  /** ≥ this many full days off in any rolling 7-day window. */
  minDaysOffPer7d: z.number().int().positive(),
});
export type DutySchemeRule = z.infer<typeof schemeSchema>;

export const DUTY_SCHEMES: Partial<Record<Jurisdiction, DutySchemeRule>> = {
  "UAE-Dubai": {
    jurisdiction: "UAE-Dubai",
    objective: "OSO#17",
    appliesWhenRiskTier: "high",
    clause: "DUOSAM OSO#17",
    maxDutyMinutesBase: 780,
    dutyReductionPerExtraAreaMinutes: 60,
    maxFlightBlockMinutesPerDay: 240,
    minRestMinutesFloor: 480,
    minRestRule: "ge_last_duty",
    minDaysOffPer7d: 1,
  },
};

for (const s of Object.values(DUTY_SCHEMES)) schemeSchema.parse(s);

/** Max allowable duty (minutes) for a day given the number of EXTRA flight areas. */
export function maxDutyMinutes(scheme: DutySchemeRule, extraFlightAreas: number): number {
  return scheme.maxDutyMinutesBase - extraFlightAreas * scheme.dutyReductionPerExtraAreaMinutes;
}
