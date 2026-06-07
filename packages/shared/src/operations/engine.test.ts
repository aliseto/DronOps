import { describe, it, expect } from "vitest";
import {
  crewReadiness,
  dutyAppliesToMission,
  missionCeilingM,
  missionReadiness,
  type CrewMemberInput,
  type MissionContext,
} from "./engine";
import type { DutyRecord } from "../currency/duty";

const NOW = new Date("2026-06-07T00:00:00Z");
const daysAhead = (n: number) => new Date(NOW.getTime() + n * 86_400_000);
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const flight = (cls: string, at: Date) => ({ eventType: "flight", airframeClass: cls, occurredAt: at, source: "manual" as const });

// A current Oman pilot: RP cert + medical valid, 3 recent flights.
const currentCurrency = {
  credentials: [
    { kind: "oman_rp_certification", verified: true, expiresAt: daysAhead(200) },
    { kind: "medical", verified: true, expiresAt: daysAhead(200) },
  ],
  recencyEvents: [flight("multirotor", daysAgo(2)), flight("multirotor", daysAgo(20)), flight("multirotor", daysAgo(40))],
};

const dutyMin = (startIso: string, mins: number): DutyRecord => ({
  startAt: new Date(startIso),
  endAt: new Date(new Date(startIso).getTime() + mins * 60_000),
});

describe("mission category → tier and gates", () => {
  it("duty applies only to specific/advanced (high) Dubai missions", () => {
    expect(dutyAppliesToMission({ jurisdiction: "UAE-Dubai", operationalCategory: "specific" })).toBe(true);
    expect(dutyAppliesToMission({ jurisdiction: "UAE-Dubai", operationalCategory: "open" })).toBe(false);
    expect(dutyAppliesToMission({ jurisdiction: "Oman", operationalCategory: "specific" })).toBe(false); // no Oman scheme
  });

  it("ceiling falls back to the jurisdiction default (Oman 122 m)", () => {
    expect(missionCeilingM({ jurisdiction: "Oman", operationalCategory: "standard" })).toBe(122);
    expect(missionCeilingM({ jurisdiction: "Oman", operationalCategory: "standard", ceilingM: 80 })).toBe(80);
  });

  it("applicable requirements never mix high and low for a mission", () => {
    const open = missionReadiness({ jurisdiction: "KSA", operationalCategory: "open" }, [], NOW);
    expect(open.applicableRequirements.some((r) => r.riskTier === "high")).toBe(false);
    const specific = missionReadiness({ jurisdiction: "KSA", operationalCategory: "specific" }, [], NOW);
    expect(specific.applicableRequirements.some((r) => r.riskTier === "low")).toBe(false);
  });
});

describe("crew readiness + the block→override journey", () => {
  const omanMission: MissionContext = { jurisdiction: "Oman", operationalCategory: "standard" };

  it("a current pilot is fit and does not block", () => {
    const member: CrewMemberInput = {
      personId: "p1",
      name: "Rana",
      role: "pilot",
      airframeClass: "multirotor",
      currency: currentCurrency,
      dutyRecords: [],
    };
    const r = crewReadiness(omanMission, member, NOW);
    expect(r.fit.verdict).toBe("fit");
    expect(r.blocks).toBe(false);
  });

  it("a non-current pilot blocks the mission; a logged override clears it", () => {
    const member: CrewMemberInput = {
      personId: "p2",
      name: "Sara",
      role: "pilot",
      airframeClass: "multirotor",
      currency: { credentials: [{ kind: "oman_rp_certification", verified: true, expiresAt: daysAhead(200) }, { kind: "medical", verified: true, expiresAt: daysAgo(1) }], recencyEvents: currentCurrency.recencyEvents },
      dutyRecords: [],
    };
    const blocked = missionReadiness(omanMission, [member], NOW);
    expect(blocked.blocked).toBe(true);
    expect(blocked.blockingCrew).toContain("Sara");

    const overridden = missionReadiness(omanMission, [{ ...member, overridden: true }], NOW);
    expect(overridden.blocked).toBe(false);
    // the underlying readiness still records WHY (audit/justification), even when overridden
    expect(overridden.crew[0]!.blocks).toBe(true);
    expect(overridden.crew[0]!.blocksEffective).toBe(false);
  });

  it("an over-duty pilot on a specific-category Dubai mission blocks; not on an open one", () => {
    const dubaiCurrency = {
      credentials: [{ kind: "dcaa_personnel_registration", verified: true, expiresAt: daysAhead(200) }],
      recencyEvents: [flight("multirotor", daysAgo(2)), flight("multirotor", daysAgo(10)), flight("multirotor", daysAgo(20))],
    };
    const overDuty = [dutyMin("2026-06-06T06:00:00Z", 900)]; // 900 min > 780 base
    const member: CrewMemberInput = { personId: "p3", name: "Jon", role: "pilot", airframeClass: "multirotor", currency: dubaiCurrency, dutyRecords: overDuty };

    const specific = missionReadiness({ jurisdiction: "UAE-Dubai", operationalCategory: "specific" }, [member], NOW);
    expect(specific.dutyApplies).toBe(true);
    expect(specific.crew[0]!.duty.status).toBe("breach");
    expect(specific.blocked).toBe(true);

    const open = missionReadiness({ jurisdiction: "UAE-Dubai", operationalCategory: "open" }, [member], NOW);
    expect(open.dutyApplies).toBe(false);
    expect(open.crew[0]!.duty.status).toBe("not-applicable");
    expect(open.blocked).toBe(false); // currency current, duty not applicable
  });
});
