import { describe, it, expect } from "vitest";
import { determineSora, type SoraInput } from "./sora";

const base: SoraInput = {
  scenario: "bvlos_sparse",
  dimension: "3m",
  m1: "none",
  m2: "none",
  m3: "none",
  initialArc: "b",
};

describe("SORA determination (S-04)", () => {
  it("reads the intrinsic GRC from scenario × dimension", () => {
    // bvlos_sparse @ 3m = 4
    expect(determineSora(base).intrinsicGrc).toBe(4);
  });

  it("applies M1–M3 mitigations to the final GRC (incl. the M3 +1 penalty)", () => {
    const r = determineSora({ ...base, m1: "medium", m2: "low", m3: "low" });
    // 4 + (-2) + 0 + (+1) = 3
    expect(r.grcAdjustment).toBe(-1);
    expect(r.finalGrc).toBe(3);
  });

  it("floors the final GRC at 1", () => {
    const r = determineSora({ scenario: "controlled", dimension: "1m", m1: "high", m2: "high", m3: "high", initialArc: "a" });
    expect(r.finalGrc).toBe(1); // 1 + (-4-2-1) clamped to 1
  });

  it("derives SAIL from the final GRC × residual ARC matrix", () => {
    // finalGrc 4, ARC-b → SAIL III
    const r = determineSora({ ...base, initialArc: "b" });
    expect(r.finalGrc).toBe(4);
    expect(r.sail).toBe(3);
    expect(r.sailRoman).toBe("III");
  });

  it("reduces the ARC by strategic mitigation steps (floored at a)", () => {
    const r = determineSora({ ...base, initialArc: "d", arcReduction: 2 });
    expect(r.residualArc).toBe("b");
  });

  it("ARC-d forces SAIL VI regardless of GRC", () => {
    expect(determineSora({ ...base, scenario: "controlled", dimension: "1m", initialArc: "d" }).sailRoman).toBe("VI");
  });

  it("flags out-of-scope (certified category) when final GRC > 7", () => {
    const r = determineSora({ scenario: "bvlos_populated", dimension: ">8m", m1: "none", m2: "none", m3: "none", initialArc: "a" });
    expect(r.finalGrc).toBe(10);
    expect(r.outOfScope).toBe(true);
    expect(r.sail).toBe(0);
    expect(r.sailRoman).toBe("—");
  });
});
