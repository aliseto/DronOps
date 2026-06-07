import { z } from "zod";
import { type JURISDICTION_KEYS } from "../jurisdictions";

type Jurisdiction = (typeof JURISDICTION_KEYS)[number];

/**
 * Occurrence/accident reporting deadlines (DRO-REG-001 §6 / v2.0 §14). Bound per
 * record by jurisdiction — never harmonized. The engine reads these.
 *
 * Oman is two-tier: accidents/serious incidents are reported IMMEDIATELY (value
 * 0; surface the 24-hour contacts on the occurrence), listed incidents within 3
 * calendar days (the `listed` sub-rule).
 */
const tier = z.object({
  value: z.number().int().min(0),
  unit: z.enum(["hours", "calendar-days"]),
  clause: z.string().min(1),
});
const schema = tier.extend({
  appliesTo: z.string().optional(),
  immediate: z.boolean().optional(),
  contacts: z.string().optional(),
  listed: tier.optional(),
});
export type OccurrenceDeadlineRule = z.infer<typeof schema>;

export const OCCURRENCE_DEADLINES: Partial<Record<Jurisdiction, OccurrenceDeadlineRule>> = {
  "UAE-Federal": {
    value: 3,
    unit: "hours",
    clause: "UAC.035",
    appliesTo: "accident / serious incident",
  },
  "UAE-Dubai": { value: 72, unit: "hours", clause: "DUOSAM OM" },
  KSA: { value: 10, unit: "calendar-days", clause: "§107.9" },
  Oman: {
    value: 0,
    unit: "hours",
    clause: "CAR-102 Subpart G",
    appliesTo: "accident / serious incident — report immediately",
    immediate: true,
    contacts: "24-hour CAA Flight Safety Department",
    listed: { value: 3, unit: "calendar-days", clause: "CAR-102 Subpart G" },
  },
};

for (const r of Object.values(OCCURRENCE_DEADLINES)) schema.parse(r);
