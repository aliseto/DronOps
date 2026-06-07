import { describe, it, expect } from "vitest";
import { REQUIREMENTS, getRequirement } from "./index";
import { RECORD_TYPES } from "./types";

describe("requirement content", () => {
  // The uploaded seed v1.0 (2026-06-07) contains 54 clause-anchored requirements
  // (the earlier "52" note predates this seed). Assert the real seed count.
  it("loads every requirement with unique ids", () => {
    expect(REQUIREMENTS).toHaveLength(54);
    expect(new Set(REQUIREMENTS.map((r) => r.id)).size).toBe(54);
  });

  it("uses only the record-type vocabulary", () => {
    const vocab = new Set<string>(RECORD_TYPES);
    for (const r of REQUIREMENTS) {
      for (const rt of r.recordTypes) expect(vocab.has(rt)).toBe(true);
    }
  });

  it("derives kind and jurisdiction per the seed rules", () => {
    for (const r of REQUIREMENTS) {
      if (r.framework === "GACA AC 107-01") expect(r.kind).toBe("guidance");
      else expect(r.kind).toBe("regulation");
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
