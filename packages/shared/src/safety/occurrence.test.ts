import { describe, it, expect } from "vitest";
import { occurrenceDeadlineStatus } from "./occurrence";

const occurredAt = new Date("2026-06-01T00:00:00.000Z");

describe("occurrence deadline status", () => {
  it("hazard observations carry no regulator clock", () => {
    const s = occurrenceDeadlineStatus(
      { classification: "hazard_observation", occurredAt, reportedToRegulatorAt: null },
      "UAE-Federal",
      new Date("2026-06-09T00:00:00.000Z"),
    );
    expect(s.applicable).toBe(false);
    expect(s.dueAt).toBeNull();
    expect(s.overdue).toBe(false);
  });

  it("binds UAE-Federal accidents to the 3h UAC.035 clock", () => {
    const s = occurrenceDeadlineStatus(
      { classification: "accident", occurredAt, reportedToRegulatorAt: null },
      "UAE-Federal",
      new Date("2026-06-01T02:00:00.000Z"), // 2h in, still within window
    );
    expect(s.applicable).toBe(true);
    expect(s.clause).toBe("UAC.035");
    expect(s.dueAt).toEqual(new Date("2026-06-01T03:00:00.000Z"));
    expect(s.overdue).toBe(false);
    expect(s.remainingMs).toBe(60 * 60 * 1000); // 1h left
  });

  it("flags overdue once past the window and not yet reported", () => {
    const s = occurrenceDeadlineStatus(
      { classification: "incident", occurredAt, reportedToRegulatorAt: null },
      "UAE-Federal",
      new Date("2026-06-01T05:00:00.000Z"), // 5h in
    );
    expect(s.overdue).toBe(true);
    expect(s.remainingMs).toBeLessThan(0);
  });

  it("stops the clock once the regulator notification is recorded", () => {
    const s = occurrenceDeadlineStatus(
      { classification: "incident", occurredAt, reportedToRegulatorAt: new Date("2026-06-01T01:30:00.000Z") },
      "UAE-Federal",
      new Date("2026-06-02T00:00:00.000Z"), // long after the window
    );
    expect(s.satisfied).toBe(true);
    expect(s.overdue).toBe(false);
    expect(s.remainingMs).toBeNull();
  });

  it("uses KSA's 10 calendar-day window", () => {
    const s = occurrenceDeadlineStatus(
      { classification: "incident", occurredAt, reportedToRegulatorAt: null },
      "KSA",
      new Date("2026-06-05T00:00:00.000Z"),
    );
    expect(s.dueAt).toEqual(new Date("2026-06-11T00:00:00.000Z"));
    expect(s.clause).toBe("§107.9");
  });

  it("surfaces Oman's report-immediately rule with 24h contacts and the 3-day listed tier", () => {
    const s = occurrenceDeadlineStatus(
      { classification: "accident", occurredAt, reportedToRegulatorAt: null },
      "Oman",
      new Date("2026-06-01T06:00:00.000Z"),
    );
    expect(s.immediate).toBe(true);
    expect(s.contacts).toContain("24-hour");
    expect(s.dueAt).toEqual(occurredAt); // due on occurrence
    expect(s.overdue).toBe(true); // 6h later, not reported
    expect(s.listed).toEqual({ dueAt: new Date("2026-06-04T00:00:00.000Z"), clause: "CAR-102 Subpart G" });
  });
});
