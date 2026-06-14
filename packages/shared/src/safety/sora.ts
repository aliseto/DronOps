/**
 * M3 Safety — SORA determination engine (S-04). Pure, table-driven implementation
 * of the JARUS SORA 2.0 specific-category risk assessment: intrinsic Ground Risk
 * Class (GRC) from the operational scenario × UA dimension, the GRC reduction
 * from mitigations M1–M3, the residual Air Risk Class (ARC), and the resulting
 * SAIL (Specific Assurance and Integrity Level) from the GRC × ARC matrix.
 *
 * Every regulatory number lives in a single constant here (no value embedded in
 * UI/server), encoding the SORA 2.0 reference tables. SAIL drives the downstream
 * OSO robustness requirements (a follow-up); this module determines GRC/ARC/SAIL,
 * which is the deliverable of S-04 and supports STS-style declarations.
 */

export type UaDimensionBand = "1m" | "3m" | "8m" | ">8m";
export const UA_DIMENSION_BANDS: readonly UaDimensionBand[] = ["1m", "3m", "8m", ">8m"];
export const UA_DIMENSION_LABELS: Record<UaDimensionBand, string> = {
  "1m": "≤ 1 m (< 700 J)",
  "3m": "≤ 3 m (< 34 kJ)",
  "8m": "≤ 8 m (< 1084 kJ)",
  ">8m": "> 8 m (> 1084 kJ)",
};

export type OperationalScenario =
  | "controlled"
  | "vlos_sparse"
  | "bvlos_sparse"
  | "vlos_populated"
  | "bvlos_populated"
  | "vlos_gathering"
  | "bvlos_gathering";

export const SCENARIO_LABELS: Record<OperationalScenario, string> = {
  controlled: "VLOS/BVLOS over controlled ground area",
  vlos_sparse: "VLOS over sparsely populated area",
  bvlos_sparse: "BVLOS over sparsely populated area",
  vlos_populated: "VLOS over populated area",
  bvlos_populated: "BVLOS over populated area",
  vlos_gathering: "VLOS over assembly of people",
  bvlos_gathering: "BVLOS over assembly of people",
};

/** Intrinsic GRC by scenario × dimension band (SORA 2.0 Table). 0 = not in scope. */
const INTRINSIC_GRC: Record<OperationalScenario, [number, number, number, number]> = {
  controlled: [1, 2, 3, 4],
  vlos_sparse: [2, 3, 4, 5],
  bvlos_sparse: [3, 4, 5, 6],
  vlos_populated: [4, 5, 6, 8],
  bvlos_populated: [5, 6, 8, 10],
  vlos_gathering: [7, 7, 7, 7],
  bvlos_gathering: [8, 8, 8, 8],
};

export type Robustness = "none" | "low" | "medium" | "high";
export const ROBUSTNESS_LEVELS: readonly Robustness[] = ["none", "low", "medium", "high"];

/**
 * GRC mitigation adjustments (SORA 2.0 reference). A negative value lowers the
 * GRC; M3 (ERP) at low robustness adds +1. Single source of truth — adjust here.
 *   M1 — Strategic mitigations for ground risk (sheltering / containment)
 *   M2 — Effects of ground impact reduced (e.g. parachute)
 *   M3 — Emergency Response Plan (ERP)
 */
const GRC_MITIGATION: Record<"m1" | "m2" | "m3", Record<Robustness, number>> = {
  m1: { none: 0, low: -1, medium: -2, high: -4 },
  m2: { none: 0, low: 0, medium: -1, high: -2 },
  m3: { none: 0, low: 1, medium: 0, high: -1 },
};

export type ArcClass = "a" | "b" | "c" | "d";
export const ARC_CLASSES: readonly ArcClass[] = ["a", "b", "c", "d"];
const ARC_INDEX: Record<ArcClass, number> = { a: 0, b: 1, c: 2, d: 3 };

/** SAIL matrix: rows = final GRC, cols = residual ARC (a,b,c,d). 0 = certified/out of SORA. */
const SAIL_MATRIX: Record<number, [number, number, number, number]> = {
  1: [1, 2, 4, 6], // GRC ≤ 2
  2: [1, 2, 4, 6],
  3: [2, 2, 4, 6],
  4: [3, 3, 4, 6],
  5: [4, 4, 4, 6],
  6: [5, 5, 5, 6],
  7: [6, 6, 6, 6],
};

export const SAIL_ROMAN = ["—", "I", "II", "III", "IV", "V", "VI"] as const;

export interface SoraInput {
  scenario: OperationalScenario;
  dimension: UaDimensionBand;
  m1: Robustness;
  m2: Robustness;
  m3: Robustness;
  initialArc: ArcClass;
  /** Strategic/tactical ARC reduction in steps (0–3); residual ARC ≥ a. */
  arcReduction?: number;
}

export interface SoraResult {
  intrinsicGrc: number;
  /** Sum of M1+M2+M3 adjustments (signed). */
  grcAdjustment: number;
  finalGrc: number;
  residualArc: ArcClass;
  /** SAIL 1–6, or 0 when the operation falls outside SORA (certified category). */
  sail: number;
  sailRoman: string;
  /** True when final GRC > 7 → certified category, SORA does not apply. */
  outOfScope: boolean;
}

const lowerArc = (arc: ArcClass, steps: number): ArcClass =>
  ARC_CLASSES[Math.max(0, ARC_INDEX[arc] - Math.max(0, steps))]!;

export function determineSora(input: SoraInput): SoraResult {
  const intrinsicGrc = INTRINSIC_GRC[input.scenario][UA_DIMENSION_BANDS.indexOf(input.dimension) as 0 | 1 | 2 | 3];
  const grcAdjustment = GRC_MITIGATION.m1[input.m1] + GRC_MITIGATION.m2[input.m2] + GRC_MITIGATION.m3[input.m3];
  // Final GRC floors at 1 (a residual ground risk always remains).
  const finalGrc = Math.max(1, intrinsicGrc + grcAdjustment);
  const residualArc = lowerArc(input.initialArc, input.arcReduction ?? 0);

  const outOfScope = finalGrc > 7;
  const sailRow = SAIL_MATRIX[finalGrc];
  const sail = outOfScope || !sailRow ? 0 : sailRow[ARC_INDEX[residualArc]] ?? 0;

  return {
    intrinsicGrc,
    grcAdjustment,
    finalGrc,
    residualArc,
    sail,
    sailRoman: SAIL_ROMAN[sail] ?? "—",
    outOfScope,
  };
}
