import { z } from "zod";
import { type JURISDICTION_KEYS } from "../jurisdictions";

type Jurisdiction = (typeof JURISDICTION_KEYS)[number];

/**
 * Duty / rest scheme rule data (DRO-REG-001 §7, DUOSAM OSO#17 — UAE-Dubai). The
 * duty engine in @dronops/shared reads these. The scheme STRUCTURE is fixed and
 * testable now; the numeric maxima/minima are an OPEN ITEM pending the owner —
 * DRO-REG-001 §16.2 flags "extract the specific hour values from the OM template
 * tables at duty-engine build". Stubbed values are `null`, and the engine reports
 * a configured scheme with null limits as "not-configured" rather than passing.
 *
 * Company agreements may only TIGHTEN these (DUOSAM) — orgs override downward in
 * org_currency_rules; never above the regulator maximum once values land.
 */
const schemeSchema = z.object({
  clause: z.string().min(1),
  /** null until the owner transcribes the OSO#17 table values. */
  maxDutyHoursPerPeriod: z.number().positive().nullable(),
  /** Rolling window (hours) the duty maximum applies over. */
  dutyPeriodHours: z.number().positive().nullable(),
  /** Minimum continuous rest (hours) between duty periods. */
  minRestHours: z.number().positive().nullable(),
  /** Max consecutive duty days before a required rest day. */
  maxConsecutiveDutyDays: z.number().int().positive().nullable(),
  /** True once every numeric value above is populated from source. */
  valuesPending: z.boolean(),
});
export type DutySchemeRule = z.infer<typeof schemeSchema>;

export const DUTY_SCHEMES: Partial<Record<Jurisdiction, DutySchemeRule>> = {
  "UAE-Dubai": {
    clause: "DUOSAM OSO#17",
    maxDutyHoursPerPeriod: null,
    dutyPeriodHours: null,
    minRestHours: null,
    maxConsecutiveDutyDays: null,
    valuesPending: true,
  },
};

for (const s of Object.values(DUTY_SCHEMES)) schemeSchema.parse(s);
