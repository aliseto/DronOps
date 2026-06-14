import { describe, it, expect } from "vitest";
import { dutyProjection, dutySchemeFor, type DutyRecord } from "./duty";
import { DUTY_SCHEMES, maxDutyMinutes } from "@dronops/content";

const scheme = DUTY_SCHEMES["UAE-Dubai"]!;
const at = (iso: string) => new Date(iso);
// A duty period of `mins` minutes starting at `startIso`, with `extra` flight areas.
const duty = (startIso: string, mins: number, extra = 0): DutyRecord => ({
  startAt: at(startIso),
  endAt: new Date(at(startIso).getTime() + mins * 60_000),
  extraFlightAreas: extra,
});

describe("OSO#17 duty engine (v1.4)", () => {
  it("worked example: 3 extra flight areas → max duty 600 min", () => {
    expect(maxDutyMinutes(scheme, 0)).toBe(780);
    expect(maxDutyMinutes(scheme, 3)).toBe(600);
  });

  it("loads real values (no longer pending)", () => {
    const s = dutySchemeFor("UAE-Dubai")!;
    expect(s.maxDutyMinutesBase).toBe(780);
    expect(s.maxFlightBlockMinutesPerDay).toBe(240);
    expect(s.minRestMinutesFloor).toBe(480);
  });

  it("returns not-applicable for an uncovered (open-category) pilot — never amber", () => {
    const r = dutyProjection([duty("2026-06-01T06:00:00Z", 900)], scheme, { applicable: false });
    expect(r.status).toBe("not-applicable");
    expect(r.breaches).toEqual([]);
  });

  // 1. duty-minutes
  it("breach 1: duty exceeds the per-day maximum (base, 0 extra areas)", () => {
    const r = dutyProjection([duty("2026-06-01T06:00:00Z", 800)], scheme); // 800 > 780
    expect(r.status).toBe("breach");
    expect(r.breaches.some((b) => b.kind === "duty-minutes-exceeded")).toBe(true);
  });

  it("breach 1b: 600-min duty with 3 extra areas meets the reduced cap; 601 breaches", () => {
    expect(dutyProjection([duty("2026-06-01T06:00:00Z", 600, 3)], scheme).status).toBe("ok");
    const over = dutyProjection([duty("2026-06-01T06:00:00Z", 601, 3)], scheme);
    expect(over.breaches.some((b) => b.kind === "duty-minutes-exceeded")).toBe(true);
  });

  // 3. rest
  it("breach 3: rest below max(last-duty, floor)", () => {
    // Day 1 duty 600 min; only 300 min rest before next duty → below max(600,480)=600.
    const r = dutyProjection(
      [duty("2026-06-01T06:00:00Z", 600), duty("2026-06-01T21:00:00Z", 120)],
      scheme,
    );
    expect(r.breaches.some((b) => b.kind === "insufficient-rest")).toBe(true);
  });

  it("rest at the floor passes when the last duty was short", () => {
    // last duty 120 min → required = max(120,480)=480; give exactly 480 rest.
    const r = dutyProjection(
      [duty("2026-06-01T06:00:00Z", 120), duty("2026-06-01T16:00:00Z", 120)],
      scheme,
    );
    expect(r.breaches.some((b) => b.kind === "insufficient-rest")).toBe(false);
  });

  // 4. weekly day off
  it("breach 4: 7 consecutive duty days with no day off", () => {
    const records = Array.from({ length: 7 }, (_, i) =>
      duty(`2026-06-${String(i + 1).padStart(2, "0")}T06:00:00Z`, 300),
    );
    expect(dutyProjection(records, scheme).breaches.some((b) => b.kind === "no-weekly-day-off")).toBe(true);
  });

  it("six duty days then a day off is fine", () => {
    const days = [1, 2, 3, 4, 5, 6, 8]; // gap on day 7
    const records = days.map((d) => duty(`2026-06-${String(d).padStart(2, "0")}T06:00:00Z`, 300));
    expect(dutyProjection(records, scheme).breaches.some((b) => b.kind === "no-weekly-day-off")).toBe(false);
  });

  // 2. block time
  it("block-time rule reports awaiting-m6 until flight records exist", () => {
    expect(dutyProjection([duty("2026-06-01T06:00:00Z", 300)], scheme).blockTime).toBe("awaiting-m6");
  });

  it("a clean single duty day is ok", () => {
    expect(dutyProjection([duty("2026-06-01T06:00:00Z", 600)], scheme).status).toBe("ok");
  });
});
