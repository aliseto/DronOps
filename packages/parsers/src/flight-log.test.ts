import { describe, it, expect } from "vitest";
import { parseFlightCsv, parseDjiDat } from "./flight-log";

// Synthetic flight: takeoff → 100 m → land, battery 100→80, over ~2 minutes.
const NORMAL = `time,latitude,longitude,altitude_m,battery_pct,in_air
2026-06-01T06:00:00Z,25.2000,55.2700,0,100,0
2026-06-01T06:00:30Z,25.2001,55.2700,50,95,1
2026-06-01T06:01:00Z,25.2002,55.2700,100,90,1
2026-06-01T06:01:30Z,25.2001,55.2700,50,85,1
2026-06-01T06:02:00Z,25.2000,55.2700,0,80,0`;

describe("parseFlightCsv", () => {
  it("derives flight metrics from a normal log", () => {
    const f = parseFlightCsv(NORMAL);
    expect(f.sampleCount).toBe(5);
    expect(f.durationSec).toBe(120);
    expect(f.blockTimeSec).toBe(90); // 3 × 30 s in-air intervals
    expect(f.maxAltitudeM).toBe(100);
    expect(f.minBatteryPct).toBe(80);
    expect(f.track).toHaveLength(5);
    expect(f.maxDistanceM).toBeGreaterThan(15);
    expect(f.maxDistanceM).toBeLessThan(30);
    expect(f.warnings).toEqual([]);
  });

  it("warns when a log has no GPS fixes (distance not computed)", () => {
    const f = parseFlightCsv(`time,altitude_m,battery_pct,in_air
2026-06-01T06:00:00Z,0,100,0
2026-06-01T06:00:30Z,50,90,1`);
    expect(f.track).toHaveLength(0);
    expect(f.maxDistanceM).toBe(0);
    expect(f.warnings.some((w) => w.includes("no GPS"))).toBe(true);
  });

  it("maps DJI/Airdata column aliases (OSD.*) and derives in-air from altitude", () => {
    const f = parseFlightCsv(`timestamp,OSD.latitude,OSD.longitude,OSD.height,battery
2026-06-01T06:00:00Z,25.2,55.27,0,100
2026-06-01T06:00:30Z,25.2,55.27,30,95`);
    expect(f.maxAltitudeM).toBe(30);
    expect(f.minBatteryPct).toBe(95);
    expect(f.track).toHaveLength(2);
  });

  it("accepts epoch-millisecond timestamps", () => {
    const t0 = Date.parse("2026-06-01T06:00:00Z");
    const f = parseFlightCsv(`time,latitude,longitude,altitude_m
${t0},25.2,55.27,10
${t0 + 60000},25.2,55.27,20`);
    expect(f.durationSec).toBe(60);
    expect(f.startedAt.toISOString()).toBe("2026-06-01T06:00:00.000Z");
  });

  it("throws on a log with no time column", () => {
    expect(() => parseFlightCsv("lat,lon\n1,2")).toThrow(/time column/);
  });

  it("DJI .DAT decoding is held until real-log validation", () => {
    expect(() => parseDjiDat(new Uint8Array([1, 2, 3]))).toThrow(/pending validation against real logs/);
  });
});
