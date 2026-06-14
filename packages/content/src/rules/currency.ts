import { z } from "zod";
import { type JURISDICTION_KEYS } from "../jurisdictions";

type Jurisdiction = (typeof JURISDICTION_KEYS)[number];

/**
 * Currency / fit-to-fly rule data (DRO-REG-001 §7, M7). The currency engine in
 * @dronops/shared reads these — no regulator value or window is embedded in the
 * engine. Three rule families:
 *
 *   1. Credential expiry alert windows (60/30/7 days) — wallet-wide.
 *   2. Medical gate (Oman CAR 102.185) — a medical credential required for
 *      fit-to-fly in Oman mode.
 *   3. Recency: KSA §107.71 knowledge recency (24-month, event-driven) and the
 *      operator recency rule (≥3 flights / 90 days / per airframe class) which
 *      is an org-configurable default, NOT a regulator value.
 *
 * `CURRENCY_REQUIREMENTS` declares, per jurisdiction, which wallet credentials
 * and which recency checks a remote pilot must satisfy to be fit-to-fly.
 */

// 1 ------------------------------------------------------------- alert windows
/** Days-before-expiry at which a credential escalates (descending). */
export const CREDENTIAL_ALERT_WINDOWS_DAYS = [60, 30, 7] as const;

// 2 -------------------------------------------------------------- medical gate
const medicalSchema = z.object({
  clause: z.string().min(1),
  credentialKind: z.string().min(1),
});
export type MedicalGateRule = z.infer<typeof medicalSchema>;

/** Medical fitness gate. Oman CAR 102.185 (incapacitation/medical condition). */
export const MEDICAL_GATES: Partial<Record<Jurisdiction, MedicalGateRule>> = {
  Oman: { clause: "CAR 102.185", credentialKind: "medical" },
};

// 3 ------------------------------------------------------------------- recency
const knowledgeSchema = z.object({
  months: z.number().int().positive(),
  clause: z.string().min(1),
  eventType: z.string().min(1),
});
export type KnowledgeRecencyRule = z.infer<typeof knowledgeSchema>;

/** KSA §107.71 — knowledge test/training within previous 24 calendar months. */
export const KNOWLEDGE_RECENCY_GATES: Partial<Record<Jurisdiction, KnowledgeRecencyRule>> = {
  KSA: { months: 24, clause: "§107.71", eventType: "knowledge_recency" },
};

const operatorRecencySchema = z.object({
  minFlights: z.number().int().positive(),
  windowDays: z.number().int().positive(),
  perAirframeClass: z.boolean(),
  /** Lead time (days) before the rule would lapse at which to warn (expiring). */
  expiringWithinDays: z.number().int().nonnegative(),
  clause: z.string().min(1),
  configurable: z.literal(true),
});
export type OperatorRecencyRule = z.infer<typeof operatorRecencySchema>;

/**
 * Operator recency default (≥3 flights / 90 days / per airframe class). This is
 * the operator's own competency scheme, not a regulator value — orgs may tighten
 * it (org_currency_rules). The engine takes the effective rule as a parameter and
 * falls back to this default.
 */
export const OPERATOR_RECENCY_DEFAULT: OperatorRecencyRule = {
  minFlights: 3,
  windowDays: 90,
  perAirframeClass: true,
  expiringWithinDays: 14,
  clause: "Operator OM competency scheme (configurable)",
  configurable: true,
};

// requirements ----------------------------------------------------------------
const requirementsSchema = z.object({
  credentials: z.array(z.string()),
  recency: z.array(z.string()),
});
export type CurrencyRequirementSet = z.infer<typeof requirementsSchema>;

/**
 * Per-jurisdiction fit-to-fly requirement sets for a remote pilot. `recency`
 * uses pseudo-kinds the engine resolves: "operator" → OPERATOR_RECENCY, and
 * eventType strings (e.g. "knowledge_recency") → KNOWLEDGE_RECENCY_GATES.
 * ISO is a QMS standard, not an operational mode — no flying requirements.
 */
export const CURRENCY_REQUIREMENTS: Partial<Record<Jurisdiction, CurrencyRequirementSet>> = {
  "UAE-Federal": { credentials: ["gcaa_uav_pilot_licence"], recency: ["operator"] },
  "UAE-Dubai": { credentials: ["dcaa_personnel_registration"], recency: ["operator"] },
  KSA: { credentials: ["ksa_rpc"], recency: ["operator", "knowledge_recency"] },
  Oman: { credentials: ["oman_rp_certification", "medical"], recency: ["operator"] },
};

for (const r of Object.values(MEDICAL_GATES)) medicalSchema.parse(r);
for (const r of Object.values(KNOWLEDGE_RECENCY_GATES)) knowledgeSchema.parse(r);
operatorRecencySchema.parse(OPERATOR_RECENCY_DEFAULT);
for (const r of Object.values(CURRENCY_REQUIREMENTS)) requirementsSchema.parse(r);
