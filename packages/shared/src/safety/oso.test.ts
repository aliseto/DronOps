import { describe, expect, it } from "vitest";
import { OSOS, osoLevelAt, osoRequirements, type OsoLevel } from "./oso";

const ORDER: Record<OsoLevel, number> = { optional: 0, low: 1, medium: 2, high: 3 };

describe("SORA 2.0 Table 6 — OSO matrix", () => {
  it("encodes exactly 24 OSOs with six SAIL cells each", () => {
    expect(OSOS).toHaveLength(24);
    expect(OSOS.map((o) => o.no)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
    for (const o of OSOS) expect(o.sail).toMatch(/^[OLMH]{6}$/);
  });

  it("robustness never decreases as SAIL rises (Table 6 invariant)", () => {
    for (const o of OSOS) {
      for (let sail = 2; sail <= 6; sail++) {
        expect(
          ORDER[osoLevelAt(o, sail)],
          `OSO#${o.no} SAIL ${sail}`,
        ).toBeGreaterThanOrEqual(ORDER[osoLevelAt(o, sail - 1)]);
      }
    }
  });

  // The asymmetric cells transcription errors hide in (each cross-verified
  // against the JARUS table; OSO#06 also guards a known bad third-party copy).
  const spots: Array<[no: number, sail: number, want: OsoLevel]> = [
    [1, 1, "optional"],
    [1, 4, "high"],
    [4, 3, "optional"], // the only row optional through SAIL III
    [4, 6, "high"],
    [6, 2, "low"],
    [6, 4, "medium"], // known one-column-shift error in a bad transcription
    [6, 5, "high"],
    [8, 3, "high"], // procedures rows jump to H at SAIL III
    [13, 4, "high"], // external services jumps to H at SAIL IV
    [19, 5, "medium"], // stays M at SAIL V
    [20, 5, "medium"],
    [22, 5, "medium"],
    [24, 3, "medium"], // starts at M already at SAIL III
    [24, 4, "high"],
  ];
  for (const [no, sail, want] of spots) {
    it(`OSO#${String(no).padStart(2, "0")} at SAIL ${sail} is ${want}`, () => {
      expect(osoLevelAt(OSOS[no - 1]!, sail)).toBe(want);
    });
  }
});

describe("osoRequirements", () => {
  it("returns all 24 with levels at a valid SAIL", () => {
    const reqs = osoRequirements(6);
    expect(reqs).toHaveLength(24);
    expect(reqs.every((r) => r.level === "high")).toBe(true);
  });
  it("is empty when the operation is out of SORA (sail 0)", () => {
    expect(osoRequirements(0)).toEqual([]);
  });
});
