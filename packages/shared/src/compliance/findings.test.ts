import { describe, it, expect } from "vitest";
import {
  allowedFindingTransitions,
  applyTriage,
  capaDueDate,
  deviationToFinding,
  findingTransition,
  sodViolation,
  DEVIATION_LEVEL,
} from "./findings";
import type { FlightDeviation } from "../flight/engine";

const raised = new Date("2026-06-01T00:00:00Z");

describe("finding engine", () => {
  it("maps deviation severity to finding level", () => {
    expect(DEVIATION_LEVEL).toEqual({ high: "major", medium: "minor", low: "observation" });
  });

  it("auto-raises a finding from a deviation with a content-driven CAPA due date", () => {
    const dev: FlightDeviation = { code: "ceiling_exceedance", detail: "Exceeded 120 m AGL", severity: "high", clause: "UAC.045" };
    const f = deviationToFinding(dev, "UAE-Federal", raised);
    expect(f.level).toBe("major");
    expect(f.deviationCode).toBe("ceiling_exceedance");
    // UAE-Federal major = 7 calendar days
    expect(f.dueAt.toISOString()).toBe("2026-06-08T00:00:00.000Z");
  });

  it("falls back to the generic CAPA window for jurisdictions without an explicit rule", () => {
    // minor = 60 days fallback
    expect(capaDueDate("Oman", "minor", raised).toISOString()).toBe("2026-07-31T00:00:00.000Z");
  });

  it("lifecycle: open can contain or be dismissed; closure verifies", () => {
    expect(allowedFindingTransitions("open").map((t) => t.to).sort()).toEqual(["containment", "false-positive"]);
    expect(findingTransition("verify", "closed")?.verifies).toBe(true);
    expect(findingTransition("open", "closed")).toBeNull();
  });

  it("enforces segregation of duties (raiser cannot verify own closure)", () => {
    expect(sodViolation("p1", "p1")).toBe(true);
    expect(sodViolation("p1", "p2")).toBe(false);
    expect(sodViolation("p1", null)).toBe(false);
  });

  it("triage: false-positive terminates; downgrade reclassifies to observation; accept keeps level", () => {
    expect(applyTriage("false-positive", "major").status).toBe("false-positive");
    expect(applyTriage("downgrade", "major").level).toBe("observation");
    expect(applyTriage("accept", "major").level).toBe("major");
  });
});
