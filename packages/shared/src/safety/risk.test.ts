import { describe, it, expect } from "vitest";
import { riskAssessmentGate } from "./risk";

describe("mission risk-assessment gate (S-03)", () => {
  it("does not gate a plain open/VLOS mission", () => {
    const r = riskAssessmentGate({ operationalCategory: "open", flightProfiles: ["vlos"], approvedProfiles: [] });
    expect(r.required).toBe(false);
    expect(r.satisfied).toBe(true);
  });

  it("blocks a BVLOS mission with no approved assessment", () => {
    const r = riskAssessmentGate({ operationalCategory: "specific", flightProfiles: ["bvlos"], approvedProfiles: [] });
    expect(r.required).toBe(true);
    expect(r.missingProfiles).toEqual(["bvlos"]);
    expect(r.satisfied).toBe(false);
    expect(r.reasons[0]).toContain("BVLOS");
  });

  it("clears once the matching profile is approved", () => {
    const r = riskAssessmentGate({ operationalCategory: "specific", flightProfiles: ["bvlos"], approvedProfiles: ["bvlos"] });
    expect(r.missingProfiles).toEqual([]);
    expect(r.satisfied).toBe(true);
  });

  it("requires each elevated profile separately", () => {
    const r = riskAssessmentGate({ operationalCategory: "specific", flightProfiles: ["bvlos", "night"], approvedProfiles: ["bvlos"] });
    expect(r.missingProfiles).toEqual(["night"]);
    expect(r.satisfied).toBe(false);
  });

  it("high-tier VLOS-only still needs at least one approved assessment", () => {
    const blocked = riskAssessmentGate({ operationalCategory: "advanced", flightProfiles: ["vlos"], approvedProfiles: [] });
    expect(blocked.required).toBe(true);
    expect(blocked.needsAnyApproved).toBe(true);
    expect(blocked.satisfied).toBe(false);

    const cleared = riskAssessmentGate({ operationalCategory: "advanced", flightProfiles: ["vlos"], approvedProfiles: ["vlos"] });
    expect(cleared.satisfied).toBe(true);
  });

  it("ignores a draft/non-matching approval (only approvedProfiles count)", () => {
    const r = riskAssessmentGate({ operationalCategory: "specific", flightProfiles: ["bvlos"], approvedProfiles: ["night"] });
    expect(r.satisfied).toBe(false);
    expect(r.missingProfiles).toEqual(["bvlos"]);
  });
});
