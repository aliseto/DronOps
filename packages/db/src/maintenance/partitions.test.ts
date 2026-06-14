import { describe, expect, it } from "vitest";
import { partitionsToEnsure } from "./partitions";

describe("partitionsToEnsure", () => {
  it("includes the current month through monthsAhead, inclusive", () => {
    const specs = partitionsToEnsure(new Date("2026-06-13T12:00:00Z"), 3);
    expect(specs.map((s) => s.name)).toEqual([
      "audit_events_202606",
      "audit_events_202607",
      "audit_events_202608",
      "audit_events_202609",
    ]);
  });

  it("emits contiguous first-of-month bounds (no gaps/overlaps)", () => {
    const specs = partitionsToEnsure(new Date("2026-06-01T00:00:00Z"), 2);
    expect(specs[0]).toEqual({ name: "audit_events_202606", from: "2026-06-01", to: "2026-07-01" });
    for (let i = 1; i < specs.length; i++) expect(specs[i]!.from).toBe(specs[i - 1]!.to);
  });

  it("rolls the year boundary correctly", () => {
    const specs = partitionsToEnsure(new Date("2027-11-15T00:00:00Z"), 3);
    expect(specs.map((s) => s.name)).toEqual([
      "audit_events_202711",
      "audit_events_202712",
      "audit_events_202801", // crosses the seeded 2027-12 cliff
      "audit_events_202802",
    ]);
    expect(specs[2]).toMatchObject({ from: "2028-01-01", to: "2028-02-01" });
  });

  it("monthsAhead=0 yields only the current month", () => {
    expect(partitionsToEnsure(new Date("2026-06-13T00:00:00Z"), 0)).toHaveLength(1);
  });

  it("rejects a negative horizon", () => {
    expect(() => partitionsToEnsure(new Date(), -1)).toThrow();
  });
});
