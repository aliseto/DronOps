import { describe, it, expect } from "vitest";
import { occurrenceReportMeta } from "./occurrence-report";

describe("occurrence report metadata (S-06)", () => {
  it("formats the UAE-Federal 3-hour window with its clause", () => {
    const m = occurrenceReportMeta("UAE-Federal", "GCAA · CAR-UAC");
    expect(m).toMatchObject({ authority: "GCAA · CAR-UAC", clause: "UAC.035", timeframe: "Within 3 hours", immediate: false });
  });

  it("formats the KSA 10 calendar-day window", () => {
    expect(occurrenceReportMeta("KSA", "GACA").timeframe).toBe("Within 10 calendar days");
  });

  it("renders Oman as immediate with 24h contacts and the listed second tier", () => {
    const m = occurrenceReportMeta("Oman", "CAA");
    expect(m.immediate).toBe(true);
    expect(m.timeframe).toBe("Immediately");
    expect(m.contacts).toContain("24-hour");
    expect(m.listedTimeframe).toBe("Within 3 calendar days");
  });

  it("degrades gracefully for a jurisdiction with no occurrence rule", () => {
    expect(occurrenceReportMeta("ISO", "ISO 9001").timeframe).toBe("Per applicable regulation");
  });
});
