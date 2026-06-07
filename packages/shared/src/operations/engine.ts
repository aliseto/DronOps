import { CEILING_DEFAULT_M, REQUIREMENTS, type RequirementDef } from "@dronops/content";
import { gatesFor, type GateRule, type Jurisdiction } from "../jurisdiction/engine";
import {
  categoryToTier,
  requirementsForMission,
  type OperationalCategory,
} from "../jurisdiction/operational-category";
import { fitToFly, type FitToFlyInput, type ReadinessVerdict } from "../currency/engine";
import { dutyProjection, dutySchemeFor, type DutyProjection, type DutyRecord } from "../currency/duty";

/**
 * M4 Operations engine — the keystone where the currency and duty engines are
 * invoked per-assignment with real consequence (mission approval). Pure: composes
 * the existing engines + content rules, embeds no regulator value.
 *
 * A mission binds ONE jurisdiction and ONE operationalCategory (derived from its
 * authorization basis). The category maps to a risk tier (open/standard→low,
 * specific/advanced→high) — the single input that the no-mixing requirement gate
 * (requirementsForMission) AND the duty-applicability gate both read.
 */

export interface MissionContext {
  jurisdiction: Jurisdiction;
  operationalCategory: OperationalCategory;
  /** Operator-set ceiling; falls back to the jurisdiction default. */
  ceilingM?: number | null;
}

/**
 * OSO#17 duty applies to an ASSIGNMENT when the mission is specific-category
 * (risk tier 'high') AND the jurisdiction defines a duty scheme. This replaces
 * the M7 org-level proxy: coverage is now per mission, derived from the
 * authorization basis.
 */
export function dutyAppliesToMission(mission: MissionContext): boolean {
  return categoryToTier(mission.operationalCategory) === "high" && dutySchemeFor(mission.jurisdiction) != null;
}

/** Applicable mission ceiling (m AGL): operator value wins, else jurisdiction default. */
export function missionCeilingM(mission: MissionContext): number | null {
  if (mission.ceilingM != null) return mission.ceilingM;
  return CEILING_DEFAULT_M[mission.jurisdiction] ?? null;
}

export interface CrewMemberInput {
  personId: string;
  name: string;
  /** Domain role on this mission (pilot, observer, …). */
  role: string;
  /** Airframe class flown (the mission aircraft's class). */
  airframeClass: string;
  currency: FitToFlyInput;
  dutyRecords: readonly DutyRecord[];
  /** A logged override clears the block (the reason lives in the audit trail). */
  overridden?: boolean;
}

export interface CrewReadiness {
  personId: string;
  name: string;
  role: string;
  fit: ReadinessVerdict;
  duty: DutyProjection;
  /** Blocks assignment before any override (currency unfit/unknown OR duty breach). */
  blocks: boolean;
  /** Effective block after applying a logged override. */
  blocksEffective: boolean;
  reasons: string[];
}

/** Readiness for one crew member on a mission: currency verdict + duty projection. */
export function crewReadiness(
  mission: MissionContext,
  member: CrewMemberInput,
  now: Date,
): CrewReadiness {
  const fit = fitToFly(mission.jurisdiction, member.airframeClass, member.currency, now);
  const applicable = dutyAppliesToMission(mission);
  const duty = dutyProjection(member.dutyRecords, dutySchemeFor(mission.jurisdiction), { applicable });
  const blocks = fit.blocksAssignment || duty.status === "breach";
  const reasons = [
    ...fit.reasons,
    ...duty.breaches.map((b) => `Duty: ${b.detail}`),
  ];
  return {
    personId: member.personId,
    name: member.name,
    role: member.role,
    fit,
    duty,
    blocks,
    blocksEffective: blocks && !member.overridden,
    reasons,
  };
}

export interface MissionReadiness {
  jurisdiction: Jurisdiction;
  operationalCategory: OperationalCategory;
  riskTier: "low" | "high";
  ceilingM: number | null;
  dutyApplies: boolean;
  gates: GateRule[];
  /** Requirements in force for this mission (baseline + the category's tier). */
  applicableRequirements: RequirementDef[];
  crew: CrewReadiness[];
  /** True when an un-overridden crew member blocks — mission can't be approved. */
  blocked: boolean;
  blockingCrew: string[];
}

/**
 * Whole-mission readiness: the gate panel (recency/registration), the applicable
 * requirement set (no high/low mixing), the ceiling, and per-crew currency+duty.
 * `blocked` reflects un-overridden blocks — the approval gate.
 */
export function missionReadiness(
  mission: MissionContext,
  crew: readonly CrewMemberInput[],
  now: Date,
): MissionReadiness {
  const crewR = crew.map((m) => crewReadiness(mission, m, now));
  const inJurisdiction = REQUIREMENTS.filter((r) => r.jurisdiction === mission.jurisdiction);
  const applicableRequirements = requirementsForMission(inJurisdiction, {
    operationalCategory: mission.operationalCategory,
  });
  const blockingCrew = crewR.filter((c) => c.blocksEffective).map((c) => c.name);
  return {
    jurisdiction: mission.jurisdiction,
    operationalCategory: mission.operationalCategory,
    riskTier: categoryToTier(mission.operationalCategory),
    ceilingM: missionCeilingM(mission),
    dutyApplies: dutyAppliesToMission(mission),
    gates: gatesFor(mission),
    applicableRequirements,
    crew: crewR,
    blocked: blockingCrew.length > 0,
    blockingCrew,
  };
}
