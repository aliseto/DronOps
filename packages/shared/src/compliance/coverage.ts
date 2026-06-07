/**
 * Requirement coverage matrix (M2, C-01/C-02). For the org's enabled frameworks,
 * each clause-anchored requirement is assessed covered / partial / gap / n-a —
 * the QMS view that turns the regulatory content library into daily work and the
 * gap list that audit packs are built from. Pure: the assessment (status +
 * controlling document) is org data; this module summarizes it.
 *
 * A requirement with no assessment row defaults to `gap` (uncovered until shown
 * otherwise). `n-a` is excluded from the coverage percentage denominator.
 */

export type CoverageStatus = "covered" | "partial" | "gap" | "n-a";

export interface RequirementLike {
  id: string;
  framework: string;
  jurisdiction: string;
  riskTier: string;
}

export interface FrameworkCoverage {
  framework: string;
  jurisdiction: string;
  total: number;
  covered: number;
  partial: number;
  gap: number;
  na: number;
  /** covered / (total − n-a), 0–100; null when every requirement is n-a. */
  pct: number | null;
}

const DEFAULT_STATUS: CoverageStatus = "gap";

export function coverageStatusOf(requirementId: string, assessed: Map<string, CoverageStatus>): CoverageStatus {
  return assessed.get(requirementId) ?? DEFAULT_STATUS;
}

function pct(covered: number, total: number, na: number): number | null {
  const denom = total - na;
  if (denom <= 0) return null;
  return Math.round((covered / denom) * 100);
}

/** Per-framework coverage rollup, sorted by gap count (most-actionable first). */
export function coverageByFramework(
  requirements: readonly RequirementLike[],
  assessed: Map<string, CoverageStatus>,
): FrameworkCoverage[] {
  const byFw = new Map<string, FrameworkCoverage>();
  for (const r of requirements) {
    let fw = byFw.get(r.framework);
    if (!fw) {
      fw = { framework: r.framework, jurisdiction: r.jurisdiction, total: 0, covered: 0, partial: 0, gap: 0, na: 0, pct: null };
      byFw.set(r.framework, fw);
    }
    fw.total++;
    const s = coverageStatusOf(r.id, assessed);
    if (s === "covered") fw.covered++;
    else if (s === "partial") fw.partial++;
    else if (s === "n-a") fw.na++;
    else fw.gap++;
  }
  const out = [...byFw.values()];
  for (const fw of out) fw.pct = pct(fw.covered, fw.total, fw.na);
  return out.sort((a, b) => b.gap - a.gap || a.framework.localeCompare(b.framework));
}

export interface CoverageTotals {
  total: number;
  covered: number;
  partial: number;
  gap: number;
  na: number;
  pct: number | null;
}

/** Org-wide coverage rollup across the enabled frameworks. */
export function overallCoverage(
  requirements: readonly RequirementLike[],
  assessed: Map<string, CoverageStatus>,
): CoverageTotals {
  const t: CoverageTotals = { total: 0, covered: 0, partial: 0, gap: 0, na: 0, pct: null };
  for (const r of requirements) {
    t.total++;
    const s = coverageStatusOf(r.id, assessed);
    if (s === "covered") t.covered++;
    else if (s === "partial") t.partial++;
    else if (s === "n-a") t.na++;
    else t.gap++;
  }
  t.pct = pct(t.covered, t.total, t.na);
  return t;
}
