import { describe, it, expect } from "vitest";
import { REQUIREMENTS, getRequirement } from "./index";
import { RECORD_TYPES } from "./types";

describe("requirement content", () => {
  // Seed v1.0 (54) + Oman addendum v1.1 (18) = 72 clause-anchored requirements.
  it("loads every requirement with unique ids", () => {
    expect(REQUIREMENTS).toHaveLength(72);
    expect(new Set(REQUIREMENTS.map((r) => r.id)).size).toBe(72);
  });

  it("includes the Oman addendum with correct derivation", () => {
    const oman = REQUIREMENTS.filter((r) => r.jurisdiction === "Oman");
    expect(oman).toHaveLength(18);
    expect(getRequirement("CAR102:025-12")?.kind).toBe("regulation");
    expect(getRequirement("AWR033:PERMIT")?.kind).toBe("guidance");
    expect(getRequirement("CAR47:MARKS")?.jurisdiction).toBe("Oman");
  });

  it("uses only the record-type vocabulary", () => {
    const vocab = new Set<string>(RECORD_TYPES);
    for (const r of REQUIREMENTS) {
      for (const rt of r.recordTypes) expect(vocab.has(rt)).toBe(true);
    }
  });

  it("derives kind and jurisdiction per the seed rules", () => {
    const guidanceFrameworks = new Set(["GACA AC 107-01", "CAA AWR 033"]);
    for (const r of REQUIREMENTS) {
      expect(r.kind).toBe(guidanceFrameworks.has(r.framework) ? "guidance" : "regulation");
    }
    expect(getRequirement("CARUAC:015h")?.jurisdiction).toBe("UAE-Federal");
    expect(getRequirement("DCAR:OM-OCC72")?.jurisdiction).toBe("UAE-Dubai");
    expect(getRequirement("GACAR107:107.139")?.jurisdiction).toBe("KSA");
  });

  it("spot-checks three known rows", () => {
    const retention = getRequirement("CARUAC:015h");
    expect(retention?.summary).toContain("24 months");
    expect(retention?.recordTypes).toContain("flight_record");

    expect(getRequirement("GACAR107:107.139")?.clause).toBe("§ 107.139");

    const occ72 = getRequirement("DCAR:OM-OCC72");
    expect(occ72?.recordTypes).toContain("occurrence");
    expect(occ72?.summary).toContain("72 hours");
  });

  it("does not invent ISO requirements (separate authoring task)", () => {
    expect(REQUIREMENTS.filter((r) => r.jurisdiction === "ISO")).toHaveLength(0);
  });
});
