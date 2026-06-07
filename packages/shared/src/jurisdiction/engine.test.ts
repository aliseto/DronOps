import { describe, it, expect } from "vitest";
import {
  deadlineFor,
  capaDeadlineFor,
  retentionFor,
  completenessFor,
  gatesFor,
} from "./engine";

const HOUR = 3_600_000;
const DAY = 86_400_000;
const occurredAt = new Date("2026-06-01T00:00:00.000Z");

describe("deadlineFor (DRO-REG-001 §6)", () => {
  it.each([
    ["UAE-Federal", 3 * HOUR, "UAC.035"],
    ["UAE-Dubai", 72 * HOUR, "DUOSAM OM"],
    ["KSA", 10 * DAY, "§107.9"],
    ["Oman", 0, "CAR-102 Subpart G"],
  ] as const)("%s deadline", (jurisdiction, deltaMs, clause) => {
    const res = deadlineFor({ occurredAt }, jurisdiction);
    expect(res).not.toBeNull();
    expect(res!.dueAt.getTime() - occurredAt.getTime()).toBe(deltaMs);
    expect(res!.rule.clause).toBe(clause);
  });

  it("Oman is immediate with 24h contacts + a 3-day listed-incident tier", () => {
    const res = deadlineFor({ occurredAt }, "Oman");
    expect(res!.rule.immediate).toBe(true);
    expect(res!.rule.contacts).toContain("24-hour");
    expect(res!.rule.listed).toMatchObject({ value: 3, unit: "calendar-days" });
  });

  it("ISO has no occurrence deadline", () => {
    expect(deadlineFor({ occurredAt }, "ISO")).toBeNull();
  });
});

describe("capaDeadlineFor (DRO-REG-001 §12)", () => {
  const raisedAt = occurredAt;
  it.each([
    ["major", 7],
    ["minor", 60],
    ["observation", 90],
  ] as const)("UAE-Federal %s = %i days", (level, days) => {
    const res = capaDeadlineFor({ raisedAt, level }, "UAE-Federal");
    expect(res!.days).toBe(days);
    expect(res!.dueAt.getTime() - raisedAt.getTime()).toBe(days * DAY);
  });

  it("KSA has no numeric CAPA default", () => {
    expect(capaDeadlineFor({ raisedAt, level: "minor" }, "KSA")).toBeNull();
  });
});

describe("retentionFor (DRO-REG-001 §4 / §15.1)", () => {
  const createdAt = new Date("2026-06-01T00:00:00.000Z");

  it("defaults to creation + 36 months", () => {
    const res = retentionFor({ type: "flight_record", createdAt });
    expect(res.months).toBe(36);
    expect(res.basis).toBe("default");
    expect(res.retainUntil.toISOString()).toBe("2029-06-01T00:00:00.000Z");
  });

  it("personnel + UAE-Dubai enabled = employment-end + 36 months", () => {
    const employmentEndAt = new Date("2027-01-15T00:00:00.000Z");
    const res = retentionFor(
      { type: "personnel_record", createdAt, employmentEndAt },
      { enabledJurisdictions: ["UAE-Dubai"] },
    );
    expect(res.basis).toBe("personnel-employment-end");
    expect(res.retainUntil.toISOString()).toBe("2030-01-15T00:00:00.000Z");
  });

  it("personnel without UAE-Dubai falls back to default", () => {
    const res = retentionFor(
      { type: "personnel_record", createdAt, employmentEndAt: new Date() },
      { enabledJurisdictions: ["KSA"] },
    );
    expect(res.basis).toBe("default");
  });
});

describe("completenessFor (DRO-REG-001 §5)", () => {
  const full = {
    dateOfFlight: "2026-06-01",
    startEndTime: "09:00-09:30",
    pilotInCommand: "A. Pilot",
    otherCrew: ["Observer"],
    aircraftIdentity: "M300/SN123/REG-1",
    uaWeightColour: "4kg grey",
    routeGps: "…",
    takeoffLandingAreas: "Site A",
    opType: "survey",
    flightRules: "VLOS",
    observations: "nominal",
    airspaceApprovalRef: "OA-1",
    pilotSignoff: "sig",
    outcome: "operational",
    prePostInspection: "done",
  };

  it("KSA requires flight rules + outcome (not airspace ref)", () => {
    const res = completenessFor({ ...full, flightRules: "" }, "KSA");
    expect(res.complete).toBe(false);
    expect(res.missing).toContain("flightRules");
    expect(completenessFor(full, "KSA").complete).toBe(true);
  });

  it("UAE-Dubai requires pilot sign-off; UAE-Federal does not", () => {
    const noSignoff = { ...full, pilotSignoff: "" };
    expect(completenessFor(noSignoff, "UAE-Dubai").missing).toContain("pilotSignoff");
    expect(completenessFor(noSignoff, "UAE-Federal").missing).not.toContain("pilotSignoff");
  });

  it("ISO has no flight-record requirements", () => {
    expect(completenessFor({}, "ISO").complete).toBe(true);
  });
});

describe("gatesFor (DRO-REG-001 §7–8)", () => {
  it("KSA missions gate on recency (24mo) and registration (3y/6mo window)", () => {
    const gates = gatesFor({ jurisdiction: "KSA" });
    const recency = gates.find((g) => g.type === "recency");
    const registration = gates.find((g) => g.type === "registration");
    expect(recency?.rule).toMatchObject({ months: 24, clause: "§107.71" });
    expect(registration?.rule).toMatchObject({ validityYears: 3, renewalWindowMonths: 6 });
  });

  it("UAE-Federal and ISO have no §107 gates", () => {
    expect(gatesFor({ jurisdiction: "UAE-Federal" })).toHaveLength(0);
    expect(gatesFor({ jurisdiction: "ISO" })).toHaveLength(0);
  });
});
