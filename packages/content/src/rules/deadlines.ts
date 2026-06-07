import { z } from "zod";
import { type JURISDICTION_KEYS } from "../jurisdictions";

type Jurisdiction = (typeof JURISDICTION_KEYS)[number];

/**
 * Occurrence/accident reporting deadlines (DRO-REG-001 §6). Bound per record by
 * jurisdiction — never harmonized. The engine reads these; values live here.
 */
const schema = z.object({
  value: z.number().int().positive(),
  unit: z.enum(["hours", "calendar-days"]),
  clause: z.string().min(1),
  appliesTo: z.string().optional(),
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
};

for (const r of Object.values(OCCURRENCE_DEADLINES)) schema.parse(r);
