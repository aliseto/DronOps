import { CEILING_DEFAULT_M } from "@dronops/content";
import type { Jurisdiction } from "../jurisdiction/engine";

/**
 * Flight-evidence engine (M6) — the "every flight audits itself" core. Given a
 * reconciled flight's telemetry-derived metrics and its jurisdiction, compute the
 * deviations (the inputs to auto-raised nonconformities). Pure: reads content
 * rules (CEILING_DEFAULT_M), embeds no regulator value.
 *
 * ── SEAM (M2/M3) ── Each deviation is the evidence for an auto-raised finding
 * (occurrence → finding → CAPA). M6 COMPUTES the deviations and stores them on the
 * flight; the auto-raise into the NCR/CAPA loop lands with M2/M3 — flagged, not
 * silently dropped. Recency/duty wiring into M7 stays "awaiting M6" until the
 * parser is validated against real logs.
 */

export type DeviationSeverity = "high" | "medium" | "low";

export interface FlightDeviation {
  code: string;
  detail: string;
  severity: DeviationSeverity;
  clause?: string;
}

/** Applicable ceiling (m AGL): explicit override wins, else the jurisdiction default. */
export function applicableCeilingM(
  jurisdiction: Jurisdiction | null | undefined,
  overrideM?: number | null,
): number | null {
  if (overrideM != null) return overrideM;
  if (jurisdiction && CEILING_DEFAULT_M[jurisdiction] != null) return CEILING_DEFAULT_M[jurisdiction]!;
  return null;
}

export interface FlightMetricsInput {
  maxAltitudeM: number;
  minBatteryPct?: number | null;
  jurisdiction?: Jurisdiction | null;
  ceilingOverrideM?: number | null;
}

export interface DeviationOptions {
  /** Battery percentage below which a landing is flagged (operator default). */
  lowBatteryPct?: number;
}

/**
 * Deviations for a flight. Currently: ceiling exceedance (vs the applicable AGL
 * ceiling) and low-battery landing. The set grows as more telemetry rules land;
 * each carries a severity + clause so the M2/M3 auto-raise can classify it.
 */
export function flightDeviations(input: FlightMetricsInput, opts: DeviationOptions = {}): FlightDeviation[] {
  const out: FlightDeviation[] = [];
  const ceiling = applicableCeilingM(input.jurisdiction, input.ceilingOverrideM);
  if (ceiling != null && input.maxAltitudeM > ceiling) {
    out.push({
      code: "ceiling-exceeded",
      severity: "high",
      detail: `Max altitude ${Math.round(input.maxAltitudeM)} m exceeds the ${ceiling} m AGL ceiling`,
      clause: `${ceiling} m AGL`,
    });
  }
  const lowBattery = opts.lowBatteryPct ?? 15;
  if (input.minBatteryPct != null && input.minBatteryPct < lowBattery) {
    out.push({
      code: "low-battery-landing",
      severity: "medium",
      detail: `Minimum battery ${input.minBatteryPct}% fell below the ${lowBattery}% threshold`,
    });
  }
  return out;
}
