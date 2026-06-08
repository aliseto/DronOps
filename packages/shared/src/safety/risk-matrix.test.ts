import { describe, it, expect } from "vitest";
import { riskCell, reviewStatus, mitigationEffective } from "./risk-matrix";

describe("5×5 risk matrix", () => {
  it("scores severity × likelihood and bands by the cell matrix", () => {
    expect(riskCell(5, 5)).toEqual({ severity: 5, likelihood: 5, score: 25, band: "high" });
    expect(riskCell(1, 1)).toEqual({ severity: 1, likelihood: 1, score: 1, band: "low" });
    expect(riskCell(3, 3)).toMatchObject({ score: 9, band: "medium" });
  });

  it("does not read a catastrophic-but-improbable corner as low", () => {
    expect(riskCell(5, 1)!.band).toBe("medium");
  });

  it("rejects out-of-scale input", () => {
    expect(riskCell(0, 3)).toBeNull();
    expect(riskCell(3, 6)).toBeNull();
    expect(riskCell(2.5, 3)).toBeNull();
  });

  it("flags mitigation that lowered or held the band", () => {
    expect(mitigationEffective("high", "low")).toBe(true);
    expect(mitigationEffective("low", "low")).toBe(true);
    expect(mitigationEffective("low", "high")).toBe(false);
  });

  it("derives review-cycle status", () => {
    const now = new Date("2026-06-08T00:00:00Z");
    expect(reviewStatus(null, now)).toBe("none");
    expect(reviewStatus(new Date("2026-06-01T00:00:00Z"), now)).toBe("overdue");
    expect(reviewStatus(new Date("2026-06-15T00:00:00Z"), now)).toBe("due-soon");
    expect(reviewStatus(new Date("2026-09-01T00:00:00Z"), now)).toBe("ok");
  });
});
