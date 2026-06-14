import { describe, it, expect } from "vitest";
import { summarizeReviewInputs, type ReviewInputsArgs } from "./review";

const base: ReviewInputsArgs = {
  coverage: { pct: 68, total: 92, covered: 62, partial: 9, gap: 21 },
  findings: [
    { status: "open", level: "major", source: "flight_deviation", dueAt: "2026-01-01", createdAt: "2026-04-10" },
    { status: "capa-in-progress", level: "minor", source: "audit", dueAt: "2026-12-01", createdAt: "2026-04-12" },
    { status: "closed", level: "major", source: "audit", dueAt: null, createdAt: "2026-01-05" },
    { status: "open", level: "observation", source: "flight_deviation", dueAt: null, createdAt: "2026-02-01" },
  ],
  crew: [
    { isPilot: true, blocked: false, expiringCredentials: 1 },
    { isPilot: true, blocked: true, expiringCredentials: 0 },
    { isPilot: false, blocked: false, expiringCredentials: 0 },
  ],
  fleet: [{ status: "operational" }, { status: "due-soon" }, { status: "grounded" }],
  missions: [
    { status: "completed", plannedStartAt: "2026-04-15" },
    { status: "completed", plannedStartAt: "2026-05-02" },
    { status: "cancelled", plannedStartAt: "2026-04-20" },
    { status: "completed", plannedStartAt: "2026-12-31" }, // outside period
  ],
  periodStart: "2026-04-01",
  periodEnd: "2026-06-30",
  asOf: "2026-06-08",
};

describe("management review summarizer (ISO 9.3, operational)", () => {
  const s = summarizeReviewInputs(base);

  it("counts open findings by level, excluding terminal", () => {
    expect(s.findings.open).toBe(3); // 2 open + 1 capa-in-progress; closed excluded
    expect(s.findings.byLevel).toEqual({ major: 1, minor: 1, observation: 1 });
  });

  it("flags overdue (open + past due as of the review date)", () => {
    expect(s.findings.overdue).toBe(1); // the 2026-01-01 due major
  });

  it("scopes activity to the review period", () => {
    expect(s.findings.raisedInPeriod).toBe(2); // 04-10, 04-12 (02-01 & 01-05 outside)
    expect(s.performance.deviationFindingsInPeriod).toBe(1); // only the 04-10 deviation finding
    expect(s.performance.missionsInPeriod.total).toBe(3); // 12-31 excluded
    expect(s.performance.missionsInPeriod.byStatus).toEqual({ completed: 2, cancelled: 1 });
  });

  it("summarizes operational resources (no commercial data)", () => {
    expect(s.performance.fleet).toEqual({ total: 3, serviceable: 2, grounded: 1 });
    expect(s.performance.currency).toEqual({ crewTotal: 3, blocked: 1, crewWithExpiringCredentials: 1 });
    expect(s.resources).toEqual({ activePilots: 1, serviceableAircraft: 2 }); // 1 pilot current (other blocked)
  });
});
