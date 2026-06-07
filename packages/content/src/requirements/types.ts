import { z } from "zod";
import { JURISDICTION_KEYS } from "../jurisdictions";

/**
 * Record-type vocabulary — the 16 values from the seed header
 * (docs/dronops_requirements_seed.sql). A requirement maps to the record types
 * that evidence it.
 */
export const RECORD_TYPES = [
  "flight_record",
  "maintenance_record",
  "document",
  "credential",
  "training_record",
  "occurrence",
  "finding",
  "management_review",
  "mission_record",
  "risk_assessment",
  "registration",
  "insurance",
  "duty_record",
  "personnel_record",
  "declaration",
  "audit_pack",
] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export const RISK_TIERS = ["baseline", "low", "high", "management_system"] as const;
export type RiskTier = (typeof RISK_TIERS)[number];

export interface RequirementDef {
  /** Verbatim seed id, e.g. "GACAR107:107.139". */
  id: string;
  framework: string;
  clause: string;
  title: string;
  /** Verbatim seed summary — QM-reviewed, never paraphrased here. */
  summary: string;
  recordTypes: RecordType[];
  version: string;
  /** Derived: AC 107-01 / AWR 033 → guidance, ISO 9001 → standard, else regulation. */
  kind: "regulation" | "guidance" | "standard";
  /** Derived from framework (the DB stores only requirement_ref strings). */
  jurisdiction: (typeof JURISDICTION_KEYS)[number];
  /** The framework's own operational-category term, shown in UI (honest label). */
  categoryNative: string;
  /**
   * Normalized engine tier the mission rule compares against (re-tag v1.3):
   * baseline (all ops) · low (open/standard only) · high (specific/advanced
   * only) · management_system (ISO QMS, never mission-gated).
   */
  riskTier: RiskTier;
}

export const requirementSchema = z.object({
  id: z.string().min(1),
  framework: z.string().min(1),
  clause: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  recordTypes: z.array(z.enum(RECORD_TYPES)).min(1),
  version: z.string().min(1),
  kind: z.enum(["regulation", "guidance", "standard"]),
  jurisdiction: z.enum(JURISDICTION_KEYS),
  categoryNative: z.string().min(1),
  riskTier: z.enum(RISK_TIERS),
}) satisfies z.ZodType<RequirementDef>;
