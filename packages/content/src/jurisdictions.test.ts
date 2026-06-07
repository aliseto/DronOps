import { describe, it, expect } from "vitest";
import {
  JURISDICTION_KEYS,
  JURISDICTIONS,
  jurisdictionsSchema,
  jurisdictionAdvisories,
  isJurisdictionKey,
} from "./jurisdictions";

describe("jurisdictions content", () => {
  it("defines every key and validates the shape", () => {
    expect(Object.keys(JURISDICTIONS).sort()).toEqual([...JURISDICTION_KEYS].sort());
    expect(jurisdictionsSchema.safeParse(JURISDICTIONS).success).toBe(true);
  });

  it("guards keys", () => {
    expect(isJurisdictionKey("KSA")).toBe(true);
    expect(isJurisdictionKey("XX")).toBe(false);
  });

  it("advises enabling Federal when only Dubai is enabled (advisory, not block)", () => {
    expect(jurisdictionAdvisories(["UAE-Dubai"])).toHaveLength(1);
    expect(jurisdictionAdvisories(["UAE-Dubai"])[0]?.level).toBe("advisory");
    expect(jurisdictionAdvisories(["UAE-Dubai", "UAE-Federal"])).toHaveLength(0);
    expect(jurisdictionAdvisories(["KSA"])).toHaveLength(0);
  });
});
