import { z } from "zod";
import { type JURISDICTION_KEYS } from "../jurisdictions";

type Jurisdiction = (typeof JURISDICTION_KEYS)[number];

/**
 * Corrective-action (CAPA) default due windows by finding level (DRO-REG-001
 * §12). GCAA classifies Level 1/2/3 → major/minor/observation with 7/60/90
 * calendar-day plans; repeated Level 2 escalates to Level 1 (handled in M2).
 */
const schema = z.object({
  major: z.number().int().positive(),
  minor: z.number().int().positive(),
  observation: z.number().int().positive(),
  unit: z.literal("calendar-days"),
  clause: z.string().min(1),
});
export type CapaRule = z.infer<typeof schema>;
export type FindingLevel = "major" | "minor" | "observation";

export const CAPA_DEFAULTS: Partial<Record<Jurisdiction, CapaRule>> = {
  "UAE-Federal": { major: 7, minor: 60, observation: 90, unit: "calendar-days", clause: "UAC.045" },
};

/** Build-to-strictest fallback for jurisdictions without an explicit CAPA rule. */
export const CAPA_DEFAULT: CapaRule = { major: 7, minor: 60, observation: 90, unit: "calendar-days", clause: "ISO 9001 §10.2" };

/** The CAPA rule for a jurisdiction, falling back to the generic default. */
export const capaRuleFor = (jurisdiction: string): CapaRule =>
  CAPA_DEFAULTS[jurisdiction as Jurisdiction] ?? CAPA_DEFAULT;

for (const r of Object.values(CAPA_DEFAULTS)) schema.parse(r);
schema.parse(CAPA_DEFAULT);
