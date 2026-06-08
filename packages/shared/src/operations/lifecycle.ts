/**
 * Mission approval lifecycle (M4) — state machine on the SAME mission record.
 * DronOps is the system of RECORD: the actual application is made on the
 * authority portal (DCAA/GCAA), external to us. Transitions are role-owned
 * (person_roles): operations_team runs planning→submitted and the post-approval
 * operational steps; approval_admin runs the authority-facing submitted→approved.
 *
 * The crew currency/duty gate (missionReadiness) is enforced ONLY at the
 * approved → ready transition — a mission is made ready (crew committed) after
 * the authority approval is on record.
 */

export type MissionState =
  | "planning"
  | "submitted_for_approval"
  | "approval_in_progress"
  | "approved"
  | "ready"
  | "flown"
  | "rejected"
  | "withdrawn";

export type LifecycleRole = "operations_team" | "approval_admin";

export interface MissionTransition {
  from: MissionState;
  to: MissionState;
  role: LifecycleRole;
  label: string;
  /** When true, the crew currency/duty gate must pass (no un-overridden blocks). */
  crewGate?: boolean;
  /** When true, the risk-assessment gate must pass (required profiles approved). */
  riskGate?: boolean;
}

export const MISSION_TRANSITIONS: MissionTransition[] = [
  { from: "planning", to: "submitted_for_approval", role: "operations_team", label: "Submit for approval" },
  { from: "submitted_for_approval", to: "approval_in_progress", role: "approval_admin", label: "Start approval" },
  { from: "approval_in_progress", to: "approved", role: "approval_admin", label: "Record approval", riskGate: true },
  { from: "approval_in_progress", to: "rejected", role: "approval_admin", label: "Reject" },
  { from: "approval_in_progress", to: "withdrawn", role: "approval_admin", label: "Withdraw" },
  { from: "approved", to: "ready", role: "operations_team", label: "Mark ready", crewGate: true },
  { from: "ready", to: "flown", role: "operations_team", label: "Mark flown" },
  // Off-ramps re-enter planning for a fresh attempt.
  { from: "rejected", to: "planning", role: "operations_team", label: "Re-plan" },
  { from: "withdrawn", to: "planning", role: "operations_team", label: "Re-plan" },
];

/** States in which crew may be assigned (preparing for, or in, ready). */
export const CREW_ASSIGNABLE_STATES: MissionState[] = ["approved", "ready"];

export function isCrewAssignable(state: MissionState): boolean {
  return CREW_ASSIGNABLE_STATES.includes(state);
}

/** Transitions available from a state for an actor holding `roles`. */
export function allowedTransitions(from: MissionState, roles: readonly string[]): MissionTransition[] {
  const held = new Set(roles);
  return MISSION_TRANSITIONS.filter((t) => t.from === from && held.has(t.role));
}

/** The matching transition if `roles` may move from→to, else null. */
export function transitionFor(
  from: MissionState,
  to: MissionState,
  roles: readonly string[],
): MissionTransition | null {
  const held = new Set(roles);
  return MISSION_TRANSITIONS.find((t) => t.from === from && t.to === to && held.has(t.role)) ?? null;
}
