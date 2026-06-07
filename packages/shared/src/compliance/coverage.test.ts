import { describe, it, expect } from "vitest";
import { coverageByFramework, overallCoverage, coverageStatusOf, type CoverageStatus } from "./coverage";

const reqs = [
  { id: "A:1", framework: "CAR-UAC", jurisdiction: "UAE-Federal", riskTier: "baseline" },
  { id: "A:2", framework: "CAR-UAC", jurisdiction: "UAE-Federal", riskTier: "low" },
  { id: "A:3", framework: "CAR-UAC", jurisdiction: "UAE-Federal", riskTier: "high" },
  { id: "I:1", framework: "ISO 9001", jurisdiction: "ISO", riskTier: "management_system" },
];

describe("coverage matrix", () => {
  it("defaults an unassessed requirement to gap", () => {
    expect(coverageStatusOf("A:1", new Map())).toBe("gap");
  });

  it("rolls up per framework and excludes n-a from the percentage", () => {
    const assessed = new Map<string, CoverageStatus>([
      ["A:1", "covered"],
      ["A:2", "covered"],
      ["A:3", "n-a"],
      // I:1 unassessed → gap
    ]);
    const byFw = coverageByFramework(reqs, assessed);
    const uac = byFw.find((f) => f.framework === "CAR-UAC")!;
    expect({ total: uac.total, covered: uac.covered, na: uac.na, gap: uac.gap }).toEqual({ total: 3, covered: 2, na: 1, gap: 0 });
    // 2 covered / (3 − 1 n-a) = 100%
    expect(uac.pct).toBe(100);
    const iso = byFw.find((f) => f.framework === "ISO 9001")!;
    expect(iso.gap).toBe(1);
    expect(iso.pct).toBe(0);
  });

  it("sorts frameworks by gap count (most-actionable first)", () => {
    const byFw = coverageByFramework(reqs, new Map([["A:1", "covered"]]));
    // CAR-UAC has 2 gaps, ISO has 1 → CAR-UAC first
    expect(byFw[0]!.framework).toBe("CAR-UAC");
  });

  it("computes org-wide totals", () => {
    const t = overallCoverage(reqs, new Map<string, CoverageStatus>([["A:1", "covered"], ["A:2", "partial"]]));
    expect({ total: t.total, covered: t.covered, partial: t.partial, gap: t.gap }).toEqual({ total: 4, covered: 1, partial: 1, gap: 2 });
    expect(t.pct).toBe(25); // 1 / 4
  });
});
