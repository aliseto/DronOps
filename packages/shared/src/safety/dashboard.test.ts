import { describe, it, expect } from "vitest";
import { summarizeSafety, type SafetyDashboardArgs } from "./dashboard";

const now = "2026-06-08T00:00:00.000Z";
const base: SafetyDashboardArgs = {
  now,
  windowDays: 90,
  // 4 flights in window, 1 outside.
  flightsAt: ["2026-06-01T00:00:00Z", "2026-05-20T00:00:00Z", "2026-05-01T00:00:00Z", "2026-04-15T00:00:00Z", "2026-01-01T00:00:00Z"],
  occurrences: [
    { classification: "incident", occurredAt: "2026-06-02T00:00:00Z", status: "investigating", reportingOverdue: true },
    { classification: "accident", occurredAt: "2026-05-10T00:00:00Z", status: "closed", reportingOverdue: false },
    { classification: "hazard_observation", occurredAt: "2026-05-05T00:00:00Z", status: "open", reportingOverdue: false },
    { classification: "incident", occurredAt: "2026-01-02T00:00:00Z", status: "closed", reportingOverdue: false }, // outside window
  ],
  hazards: [
    { status: "open", residualBand: "high", reviewOverdue: true },
    { status: "monitored", residualBand: "low", reviewOverdue: false },
    { status: "closed", residualBand: "high", reviewOverdue: false },
    { status: "open", residualBand: null, reviewOverdue: false },
  ],
  deviations: [
    { deviationCode: "ceiling_exceedance", createdAt: "2026-06-01T00:00:00Z" },
    { deviationCode: "ceiling_exceedance", createdAt: "2026-05-15T00:00:00Z" },
    { deviationCode: "low_battery", createdAt: "2026-05-20T00:00:00Z" },
    { deviationCode: "low_battery", createdAt: "2026-01-01T00:00:00Z" }, // outside window
  ],
};

describe("safety dashboard summarizer (S-07)", () => {
  const s = summarizeSafety(base);

  it("computes the occurrence rate per 100 flights in the window", () => {
    expect(s.flights.inWindow).toBe(4);
    expect(s.occurrences.inWindow).toBe(3); // the Jan occurrence is excluded
    // 3 / 4 * 100 = 75
    expect(s.occurrenceRatePer100).toBe(75);
  });

  it("buckets occurrences by class and counts open investigations + overdue reporting", () => {
    expect(s.occurrences.byClass).toMatchObject({ incident: 1, accident: 1, hazard_observation: 1 });
    expect(s.occurrences.openInvestigations).toBe(2); // investigating + open (closed excluded)
    expect(s.occurrences.overdueReporting).toBe(1);
  });

  it("ranks the top deviation types in the window", () => {
    expect(s.deviations.inWindow).toBe(3);
    expect(s.deviations.top[0]).toEqual({ code: "ceiling_exceedance", count: 2 });
  });

  it("profiles open hazards by residual band and flags overdue reviews", () => {
    expect(s.hazards.open).toBe(3); // closed excluded
    expect(s.hazards.byResidual).toMatchObject({ high: 1, low: 1 });
    expect(s.hazards.unscored).toBe(1);
    expect(s.hazards.overdueReviews).toBe(1);
  });

  it("returns null rate when there are no flights in the window", () => {
    expect(summarizeSafety({ ...base, flightsAt: [] }).occurrenceRatePer100).toBeNull();
  });

  it("builds a trailing monthly trend including the current month", () => {
    expect(s.trend).toHaveLength(6);
    expect(s.trend.at(-1)).toEqual({ month: "2026-06", occurrences: 1 });
    expect(s.trend.find((t) => t.month === "2026-05")?.occurrences).toBe(2);
  });
});
