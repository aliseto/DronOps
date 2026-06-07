import { describe, it, expect } from "vitest";
import { allowedTransitions, transitionFor, isCrewAssignable } from "./lifecycle";

describe("mission lifecycle", () => {
  it("operations_team submits from planning; approval_admin cannot", () => {
    expect(allowedTransitions("planning", ["operations_team"]).map((t) => t.to)).toEqual(["submitted_for_approval"]);
    expect(allowedTransitions("planning", ["approval_admin"])).toEqual([]);
  });

  it("approval_admin owns the authority-facing transitions", () => {
    const tos = allowedTransitions("approval_in_progress", ["approval_admin"]).map((t) => t.to).sort();
    expect(tos).toEqual(["approved", "rejected", "withdrawn"]);
    expect(allowedTransitions("approval_in_progress", ["operations_team"])).toEqual([]);
  });

  it("approved → ready carries the crew gate and is operations_team-owned", () => {
    const t = transitionFor("approved", "ready", ["operations_team"]);
    expect(t?.crewGate).toBe(true);
    expect(transitionFor("approved", "ready", ["approval_admin"])).toBeNull();
  });

  it("crew is assignable only at approved/ready", () => {
    expect(isCrewAssignable("planning")).toBe(false);
    expect(isCrewAssignable("approved")).toBe(true);
    expect(isCrewAssignable("ready")).toBe(true);
    expect(isCrewAssignable("flown")).toBe(false);
  });

  it("off-ramps re-enter planning", () => {
    expect(transitionFor("rejected", "planning", ["operations_team"])?.label).toBe("Re-plan");
    expect(transitionFor("withdrawn", "planning", ["operations_team"])?.label).toBe("Re-plan");
  });
});
