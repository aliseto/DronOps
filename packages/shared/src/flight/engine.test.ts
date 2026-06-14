import { describe, it, expect } from "vitest";
import { applicableCeilingM, flightDeviations } from "./engine";

describe("flight deviations", () => {
  it("uses the Oman 122 m ceiling default", () => {
    expect(applicableCeilingM("Oman")).toBe(122);
    expect(applicableCeilingM("Oman", 80)).toBe(80); // override wins
    expect(applicableCeilingM("KSA")).toBeNull(); // no default → no ceiling deviation
  });

  it("flags a ceiling exceedance (high severity)", () => {
    const d = flightDeviations({ maxAltitudeM: 150, jurisdiction: "Oman" });
    expect(d.some((x) => x.code === "ceiling-exceeded" && x.severity === "high")).toBe(true);
  });

  it("does not flag when under the ceiling", () => {
    expect(flightDeviations({ maxAltitudeM: 100, jurisdiction: "Oman" })).toEqual([]);
  });

  it("flags a low-battery landing", () => {
    const d = flightDeviations({ maxAltitudeM: 50, jurisdiction: "Oman", minBatteryPct: 8 });
    expect(d.some((x) => x.code === "low-battery-landing")).toBe(true);
  });

  it("no ceiling rule → no ceiling deviation even when high", () => {
    expect(flightDeviations({ maxAltitudeM: 400, jurisdiction: "KSA" })).toEqual([]);
  });
});
