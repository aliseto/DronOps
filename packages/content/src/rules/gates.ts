import { z } from "zod";
import { type JURISDICTION_KEYS } from "../jurisdictions";

type Jurisdiction = (typeof JURISDICTION_KEYS)[number];

/**
 * Mission gate rules (DRO-REG-001 §7–8). Gates block assignment with a logged
 * override path; values live here, never embedded in the engine.
 */

const recencySchema = z.object({
  months: z.number().int().positive(),
  clause: z.string().min(1),
  credentialKind: z.string().min(1),
});
export type RecencyRule = z.infer<typeof recencySchema>;

// KSA §107.71 — knowledge test/training within previous 24 calendar months.
export const RECENCY_GATES: Partial<Record<Jurisdiction, RecencyRule>> = {
  KSA: { months: 24, clause: "§107.71", credentialKind: "knowledge_recency" },
};

const registrationSchema = z.object({
  validityYears: z.number().int().positive(),
  renewalWindowMonths: z.number().int().positive(),
  clause: z.string().min(1),
});
export type RegistrationRule = z.infer<typeof registrationSchema>;

// KSA Part 48 — registration expires ≤ 3 years; renewal window 6 months pre-expiry.
export const REGISTRATION_GATES: Partial<Record<Jurisdiction, RegistrationRule>> = {
  KSA: { validityYears: 3, renewalWindowMonths: 6, clause: "GACAR Part 48 §48.13 / §48.15" },
};

for (const r of Object.values(RECENCY_GATES)) recencySchema.parse(r);
for (const r of Object.values(REGISTRATION_GATES)) registrationSchema.parse(r);
