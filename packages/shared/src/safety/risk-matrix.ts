/**
 * M3 Safety — 5×5 risk matrix (S-02). Pure scoring used by the hazard/risk
 * register: severity × likelihood → a risk score and a tolerability band, plus
 * the residual band after mitigation and the review-cycle status. ICAO-style
 * default matrix (configurable 5×5 is future work); both axes are 1–5.
 */
export type RiskBand = "low" | "medium" | "high";

export const SEVERITY_LABELS: Record<number, string> = {
  1: "Negligible",
  2: "Minor",
  3: "Major",
  4: "Hazardous",
  5: "Catastrophic",
};

export const LIKELIHOOD_LABELS: Record<number, string> = {
  1: "Improbable",
  2: "Remote",
  3: "Occasional",
  4: "Probable",
  5: "Frequent",
};

/**
 * Default tolerability matrix keyed [severity][likelihood] (both 1–5). A pure
 * product misclassifies the corners (5×1 "catastrophic but improbable" should
 * not read as low), so the bands come from a cell matrix, not severity×likelihood.
 */
const MATRIX: Record<number, Record<number, RiskBand>> = {
  5: { 1: "medium", 2: "high", 3: "high", 4: "high", 5: "high" },
  4: { 1: "low", 2: "medium", 3: "high", 4: "high", 5: "high" },
  3: { 1: "low", 2: "medium", 3: "medium", 4: "high", 5: "high" },
  2: { 1: "low", 2: "low", 3: "medium", 4: "medium", 5: "high" },
  1: { 1: "low", 2: "low", 3: "low", 4: "low", 5: "medium" },
};

const inScale = (n: number) => Number.isInteger(n) && n >= 1 && n <= 5;

export interface RiskCell {
  severity: number;
  likelihood: number;
  score: number; // severity × likelihood (1–25), for display/sort
  band: RiskBand;
}

/** Score a single (severity, likelihood) cell. Returns null for out-of-scale input. */
export function riskCell(severity: number, likelihood: number): RiskCell | null {
  if (!inScale(severity) || !inScale(likelihood)) return null;
  return { severity, likelihood, score: severity * likelihood, band: MATRIX[severity]![likelihood]! };
}

export const RISK_BAND_RANK: Record<RiskBand, number> = { low: 0, medium: 1, high: 2 };

/** True when mitigation lowered the band (or held it at low). For register hygiene. */
export function mitigationEffective(inherent: RiskBand, residual: RiskBand): boolean {
  return RISK_BAND_RANK[residual] <= RISK_BAND_RANK[inherent];
}

export type ReviewStatus = "ok" | "due-soon" | "overdue" | "none";

/** Review-cycle status for a hazard. due-soon within 14 days of nextReviewAt. */
export function reviewStatus(nextReviewAt: Date | null, now: Date): ReviewStatus {
  if (!nextReviewAt) return "none";
  const ms = nextReviewAt.getTime() - now.getTime();
  if (ms < 0) return "overdue";
  if (ms <= 14 * 24 * 60 * 60 * 1000) return "due-soon";
  return "ok";
}
