/**
 * M3 Safety — safety performance summarizer (S-07). Pure aggregation over data
 * already gathered elsewhere (M3 occurrences + hazards, M6 flights, M2
 * deviation findings); builds no new analytics subsystem. Produces the dashboard
 * headline (occurrence rate per 100 flights), the leading indicators (deviation
 * counts, top deviation types, hazard residual profile, overdue reviews) and a
 * monthly occurrence trend. Point-in-time snapshots are "as of" now; rates are
 * scoped to a trailing window.
 */
import type { OccurrenceClass } from "./occurrence";
import type { RiskBand } from "./risk-matrix";

export interface SafetyOccurrenceInput {
  classification: OccurrenceClass;
  occurredAt: string;
  status: string;
  reportingOverdue: boolean;
}
export interface SafetyHazardInput {
  status: string;
  residualBand: RiskBand | null;
  reviewOverdue: boolean;
}
export interface SafetyDeviationInput {
  deviationCode: string | null;
  createdAt: string;
}

export interface SafetyDashboardArgs {
  now: string;
  windowDays: number;
  flightsAt: readonly string[]; // flown_at timestamps
  occurrences: readonly SafetyOccurrenceInput[];
  hazards: readonly SafetyHazardInput[];
  deviations: readonly SafetyDeviationInput[];
  /** Number of trailing months in the trend (default 6). */
  trendMonths?: number;
}

export interface SafetyDashboard {
  window: { days: number; from: string; to: string };
  flights: { inWindow: number; total: number };
  occurrences: {
    inWindow: number;
    total: number;
    byClass: Record<OccurrenceClass, number>;
    openInvestigations: number;
    overdueReporting: number;
  };
  /** Occurrences per 100 flights in the window; null when no flights. */
  occurrenceRatePer100: number | null;
  deviations: { inWindow: number; top: { code: string; count: number }[] };
  hazards: { open: number; byResidual: Record<RiskBand, number>; unscored: number; overdueReviews: number };
  trend: { month: string; occurrences: number }[];
}

const TERMINAL_OCC = new Set(["closed"]);
const monthKey = (iso: string) => iso.slice(0, 7); // YYYY-MM

export function summarizeSafety(a: SafetyDashboardArgs): SafetyDashboard {
  const to = new Date(a.now);
  const from = new Date(to.getTime() - a.windowDays * 86_400_000);
  const fromIso = from.toISOString();
  const inWin = (iso: string) => iso >= fromIso && iso <= a.now;

  const flightsInWindow = a.flightsAt.filter(inWin).length;

  const byClass: Record<OccurrenceClass, number> = { incident: 0, accident: 0, hazard_observation: 0 };
  let occInWindow = 0;
  let openInvestigations = 0;
  let overdueReporting = 0;
  for (const o of a.occurrences) {
    if (inWin(o.occurredAt)) {
      occInWindow++;
      byClass[o.classification]++;
    }
    if (!TERMINAL_OCC.has(o.status)) openInvestigations++;
    if (o.reportingOverdue) overdueReporting++;
  }

  const devCounts = new Map<string, number>();
  let devInWindow = 0;
  for (const d of a.deviations) {
    if (!inWin(d.createdAt)) continue;
    devInWindow++;
    if (d.deviationCode) devCounts.set(d.deviationCode, (devCounts.get(d.deviationCode) ?? 0) + 1);
  }
  const top = [...devCounts.entries()].map(([code, count]) => ({ code, count })).sort((x, y) => y.count - x.count).slice(0, 5);

  const byResidual: Record<RiskBand, number> = { low: 0, medium: 0, high: 0 };
  let openHazards = 0;
  let unscored = 0;
  let overdueReviews = 0;
  for (const h of a.hazards) {
    if (h.status !== "closed") openHazards++;
    if (h.reviewOverdue) overdueReviews++;
    if (h.status === "closed") continue;
    if (h.residualBand) byResidual[h.residualBand]++;
    else unscored++;
  }

  // Trailing monthly occurrence trend (oldest → newest).
  const months = a.trendMonths ?? 6;
  const trend: { month: string; occurrences: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - i, 1));
    trend.push({ month: d.toISOString().slice(0, 7), occurrences: 0 });
  }
  const trendIndex = new Map(trend.map((t, i) => [t.month, i]));
  for (const o of a.occurrences) {
    const idx = trendIndex.get(monthKey(o.occurredAt));
    if (idx != null) trend[idx]!.occurrences++;
  }

  return {
    window: { days: a.windowDays, from: fromIso, to: a.now },
    flights: { inWindow: flightsInWindow, total: a.flightsAt.length },
    occurrences: { inWindow: occInWindow, total: a.occurrences.length, byClass, openInvestigations, overdueReporting },
    occurrenceRatePer100: flightsInWindow === 0 ? null : Math.round((occInWindow / flightsInWindow) * 1000) / 10,
    deviations: { inWindow: devInWindow, top },
    hazards: { open: openHazards, byResidual, unscored, overdueReviews },
    trend,
  };
}
