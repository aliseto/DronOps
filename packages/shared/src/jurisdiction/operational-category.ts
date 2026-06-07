import type { RiskTier } from "@dronops/content";

/**
 * Operational-category gating (re-tag v1.3). Keeps the engine from mixing
 * high-risk-operation requirements with standard/low-risk ones. A requirement
 * carries a normalized `riskTier`; a mission carries an `operationalCategory`
 * derived from its authorization basis per jurisdiction (set in M4). The rule
 * below is what M2 coverage and M4 gates both read — no values are embedded here.
 *
 *   applicable(mission) =
 *     riskTier === 'baseline'                       (the floor — every mission)
 *     OR riskTier === categoryToTier(operationalCategory)
 *   'management_system' (ISO QMS) is NEVER per-mission — it surfaces in the org
 *   QMS/compliance view, so it is excluded here.
 */

/** Authorization-basis category a mission binds to (M4 sets this per jurisdiction). */
export type OperationalCategory = "open" | "standard" | "specific" | "advanced";

/** open/standard → low-risk; specific/advanced → high-risk. */
const CATEGORY_TO_TIER: Record<OperationalCategory, "low" | "high"> = {
  open: "low",
  standard: "low",
  specific: "high",
  advanced: "high",
};

export function categoryToTier(category: OperationalCategory): "low" | "high" {
  return CATEGORY_TO_TIER[category];
}

/** Whether a requirement of `riskTier` applies to a mission of `category`. */
export function requirementAppliesToMission(
  riskTier: RiskTier,
  category: OperationalCategory,
): boolean {
  if (riskTier === "management_system") return false; // org-wide QMS, never mission-gated
  if (riskTier === "baseline") return true; // the floor: every operation
  return riskTier === CATEGORY_TO_TIER[category];
}

/** Filter a requirement list to those applicable to a mission's category. */
export function requirementsForMission<T extends { riskTier: RiskTier }>(
  requirements: readonly T[],
  mission: { operationalCategory: OperationalCategory },
): T[] {
  return requirements.filter((r) => requirementAppliesToMission(r.riskTier, mission.operationalCategory));
}
