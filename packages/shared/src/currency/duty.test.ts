import { describe, it, expect } from "vitest";
import { dutyProjection, dutySchemeFor } from "./duty";
import type { DutySchemeRule } from "@dronops/content";

const at = (iso: string) => new Date(iso);
// Concrete scheme for exercising breach logic (the real UAE-Dubai values are pending).
const scheme: DutySchemeRule = {
  clause: "TEST",
  maxDutyHoursPerPeriod: 10,
  dutyPeriodHours: 24,
  minRestHours: 11,
  maxConsecutiveDutyDays: 5,
  valuesPending: false,
};

describe("dutyProjection", () => {
  it("returns no-scheme when none applies", () => {
    expect(dutyProjection([], undefined).status).toBe("no-scheme");
  });

  it("returns not-applicable for a pilot the rule doesn't cover (never amber)", () => {
    const real = dutySchemeFor("UAE-Dubai");
    // Even with a configured scheme + duty records, open-category pilots are out of scope.
    const r = dutyProjection(
      [{ startAt: at("2026-06-01T06:00:00Z"), endAt: at("2026-06-01T18:30:00Z") }],
      scheme,
      { applicable: false },
    );
    expect(r.status).toBe("not-applicable");
    expect(r.breaches).toEqual([]);
    // not-applicable is distinct from not-configured (applicable-but-unset).
    expect(dutyProjection([], real, { applicable: true }).status).toBe("not-configured");
  });

  it("returns not-configured for the real UAE-Dubai scheme (OSO#17 values pending)", () => {
    const real = dutySchemeFor("UAE-Dubai");
    expect(real?.valuesPending).toBe(true);
    expect(dutyProjection([{ startAt: at("2026-06-01T06:00:00Z"), endAt: at("2026-06-01T23:00:00Z") }], real).status).toBe(
      "not-configured",
    );
  });

  it("flags a duty period exceeding the maximum", () => {
    const r = dutyProjection([{ startAt: at("2026-06-01T06:00:00Z"), endAt: at("2026-06-01T18:30:00Z") }], scheme);
    expect(r.status).toBe("breach");
    expect(r.breaches.some((b) => b.kind === "duty-hours-exceeded")).toBe(true);
  });

  it("flags insufficient rest between consecutive duties", () => {
    const r = dutyProjection(
      [
        { startAt: at("2026-06-01T06:00:00Z"), endAt: at("2026-06-01T14:00:00Z") },
        { startAt: at("2026-06-01T20:00:00Z"), endAt: at("2026-06-02T04:00:00Z") },
      ],
      scheme,
    );
    expect(r.breaches.some((b) => b.kind === "insufficient-rest")).toBe(true);
  });

  it("passes a compliant pair of duties", () => {
    const r = dutyProjection(
      [
        { startAt: at("2026-06-01T06:00:00Z"), endAt: at("2026-06-01T14:00:00Z") },
        { startAt: at("2026-06-02T06:00:00Z"), endAt: at("2026-06-02T14:00:00Z") },
      ],
      scheme,
    );
    expect(r.status).toBe("ok");
    expect(r.breaches).toEqual([]);
  });

  it("flags more than the allowed consecutive duty days", () => {
    const records = Array.from({ length: 6 }, (_, i) => {
      const day = String(i + 1).padStart(2, "0");
      return { startAt: at(`2026-06-${day}T06:00:00Z`), endAt: at(`2026-06-${day}T12:00:00Z`) };
    });
    const r = dutyProjection(records, scheme);
    expect(r.breaches.some((b) => b.kind === "consecutive-days-exceeded")).toBe(true);
  });
});
