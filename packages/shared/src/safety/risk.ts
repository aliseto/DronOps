import { categoryToTier, type OperationalCategory } from "../jurisdiction/operational-category";

/**
 * M3 Safety — mission risk-assessment gate (S-03). The proactive approval gate
 * that sits beside the currency and duty gates: a mission cannot be approved
 * without a valid (approved) risk assessment of the required profile.
 *
 * Pure rule. The "required profile" is derived from the mission's declared
 * flight profiles — the elevated ones (EVLOS/BVLOS/night/populated-area) each
 * demand a matching approved assessment — and from the operational category:
 * any specific/advanced (high-tier) operation requires at least one approved
 * assessment even when only VLOS is declared. Plain open/low VLOS carries no RA
 * gate (the baseline operation), matching the PRD's BVLOS acceptance criterion.
 */
export type FlightProfile = "vlos" | "evlos" | "bvlos" | "night" | "populated";

export const FLIGHT_PROFILES: readonly FlightProfile[] = ["vlos", "evlos", "bvlos", "night", "populated"];

export const FLIGHT_PROFILE_LABELS: Record<FlightProfile, string> = {
  vlos: "VLOS",
  evlos: "EVLOS",
  bvlos: "BVLOS",
  night: "Night",
  populated: "Over populated area",
};

/** Elevated profiles that each require a matching approved risk assessment. */
const RA_REQUIRED: ReadonlySet<FlightProfile> = new Set(["evlos", "bvlos", "night", "populated"]);

export interface RiskGateInput {
  operationalCategory: OperationalCategory;
  /** Profiles the mission is flown under (declared in planning). */
  flightProfiles: readonly FlightProfile[];
  /** Profiles covered by an APPROVED risk assessment attached to the mission. */
  approvedProfiles: readonly FlightProfile[];
}

export interface RiskGateResult {
  /** Whether this mission needs a risk assessment at all. */
  required: boolean;
  /** Specific profiles that each need a matching approved assessment. */
  requiredProfiles: FlightProfile[];
  /** Required profiles not yet covered by an approved assessment. */
  missingProfiles: FlightProfile[];
  /** True when the mission needs an RA only on high-tier grounds (no elevated profile). */
  needsAnyApproved: boolean;
  /** The gate is clear — approval may proceed. */
  satisfied: boolean;
  reasons: string[];
}

export function riskAssessmentGate(input: RiskGateInput): RiskGateResult {
  const requiredProfiles = input.flightProfiles.filter((p) => RA_REQUIRED.has(p));
  const highTier = categoryToTier(input.operationalCategory) === "high";
  const required = requiredProfiles.length > 0 || highTier;
  const approved = new Set(input.approvedProfiles);

  const missingProfiles = requiredProfiles.filter((p) => !approved.has(p));
  // High-tier with no elevated profile still needs at least one approved RA.
  const needsAnyApproved = required && requiredProfiles.length === 0;
  const anyApproved = input.approvedProfiles.length > 0;

  const satisfied = !required || (missingProfiles.length === 0 && (!needsAnyApproved || anyApproved));

  const reasons: string[] = [];
  for (const p of missingProfiles) reasons.push(`No approved risk assessment for ${FLIGHT_PROFILE_LABELS[p]}`);
  if (needsAnyApproved && !anyApproved) reasons.push("Specific/advanced operation requires an approved risk assessment");

  return { required, requiredProfiles, missingProfiles, needsAnyApproved, satisfied, reasons };
}
