/**
 * Management review (ISO 9001 §9.3) input summarizer — the OPERATIONAL/aviation
 * QMS review only. Pure aggregation over data already gathered elsewhere (M2
 * findings + coverage, M4 missions, M5 fleet, M7 crew); it builds NO new
 * analytics subsystem and pulls NO commercial data (financials, sales, payroll
 * are deliberately out of scope — those belong to the board, not the QMS review).
 *
 * Point-in-time inputs (coverage, open findings, crew currency, fleet) are "as
 * of" the review; activity inputs (findings raised, missions flown) are scoped to
 * the review PERIOD. The server fetches; this freezes the numbers into the
 * snapshot stored on the signed, immutable record.
 */

const TERMINAL_FINDING = new Set(["closed", "false-positive"]);

export interface ReviewCoverageInput {
  pct: number | null;
  total: number;
  covered: number;
  partial: number;
  gap: number;
}
export interface ReviewFindingInput {
  status: string;
  level: string;
  source: string;
  dueAt: string | null;
  createdAt: string;
}
export interface ReviewCrewInput {
  isPilot: boolean;
  blocked: boolean;
  expiringCredentials: number;
}
export interface ReviewFleetInput {
  status: "operational" | "due-soon" | "in-maintenance" | "grounded";
}
export interface ReviewMissionInput {
  status: string;
  plannedStartAt: string | null;
}

export interface ReviewInputsArgs {
  coverage: ReviewCoverageInput;
  findings: readonly ReviewFindingInput[];
  crew: readonly ReviewCrewInput[];
  fleet: readonly ReviewFleetInput[];
  missions: readonly ReviewMissionInput[];
  periodStart: string;
  periodEnd: string;
  asOf: string;
}

export interface ReviewInputsSnapshot {
  coverage: ReviewCoverageInput;
  findings: {
    open: number;
    overdue: number;
    byLevel: { major: number; minor: number; observation: number };
    raisedInPeriod: number;
  };
  performance: {
    missionsInPeriod: { total: number; byStatus: Record<string, number> };
    /** Deviation/occurrence trend proxy: deviation-sourced findings raised in period. */
    deviationFindingsInPeriod: number;
    currency: { crewTotal: number; blocked: number; crewWithExpiringCredentials: number };
    fleet: { total: number; serviceable: number; grounded: number };
  };
  resources: { activePilots: number; serviceableAircraft: number };
}

const inPeriod = (iso: string | null, start: string, end: string) => iso != null && iso >= start && iso <= end;

/** Freeze the ISO 9.3 operational inputs into the review snapshot. Pure. */
export function summarizeReviewInputs(a: ReviewInputsArgs): ReviewInputsSnapshot {
  const open = a.findings.filter((f) => !TERMINAL_FINDING.has(f.status));
  const byLevel = { major: 0, minor: 0, observation: 0 };
  for (const f of open) {
    if (f.level === "major") byLevel.major++;
    else if (f.level === "minor") byLevel.minor++;
    else if (f.level === "observation") byLevel.observation++;
  }

  const byStatus: Record<string, number> = {};
  let missionsTotal = 0;
  for (const m of a.missions) {
    if (!inPeriod(m.plannedStartAt, a.periodStart, a.periodEnd)) continue;
    missionsTotal++;
    byStatus[m.status] = (byStatus[m.status] ?? 0) + 1;
  }

  const serviceable = a.fleet.filter((x) => x.status === "operational" || x.status === "due-soon").length;
  const grounded = a.fleet.length - serviceable;

  return {
    coverage: a.coverage,
    findings: {
      open: open.length,
      overdue: open.filter((f) => f.dueAt != null && f.dueAt < a.asOf).length,
      byLevel,
      raisedInPeriod: a.findings.filter((f) => inPeriod(f.createdAt, a.periodStart, a.periodEnd)).length,
    },
    performance: {
      missionsInPeriod: { total: missionsTotal, byStatus },
      deviationFindingsInPeriod: a.findings.filter((f) => f.source === "flight_deviation" && inPeriod(f.createdAt, a.periodStart, a.periodEnd)).length,
      currency: {
        crewTotal: a.crew.length,
        blocked: a.crew.filter((c) => c.blocked).length,
        crewWithExpiringCredentials: a.crew.filter((c) => c.expiringCredentials > 0).length,
      },
      fleet: { total: a.fleet.length, serviceable, grounded },
    },
    resources: {
      activePilots: a.crew.filter((c) => c.isPilot && !c.blocked).length,
      serviceableAircraft: serviceable,
    },
  };
}
