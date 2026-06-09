import "server-only";
import { and, eq } from "drizzle-orm";
import { getAdminDb } from "@dronops/db";
import { findings, flightRecords } from "@dronops/db/schema";
import { summarizeSafety, type SafetyDashboard } from "@dronops/shared";
import { listOccurrences } from "./safety";
import { listHazards } from "./hazards";

/**
 * Assemble the S-07 safety dashboard — pure aggregation (summarizeSafety) over
 * existing M3/M6/M2 data, scoped to a trailing window for the rates. No new
 * analytics store; nothing written.
 */
export async function getSafetyDashboard(orgId: string, windowDays = 90): Promise<SafetyDashboard> {
  const db = getAdminDb();
  const [occ, haz, flights, devs] = await Promise.all([
    listOccurrences(orgId),
    listHazards(orgId),
    db.select({ flownAt: flightRecords.flownAt }).from(flightRecords).where(eq(flightRecords.orgId, orgId)),
    db
      .select({ deviationCode: findings.deviationCode, createdAt: findings.createdAt })
      .from(findings)
      .where(and(eq(findings.orgId, orgId), eq(findings.source, "flight_deviation"))),
  ]);

  return summarizeSafety({
    now: new Date().toISOString(),
    windowDays,
    flightsAt: flights.map((f) => f.flownAt.toISOString()),
    occurrences: occ.map((o) => ({ classification: o.classification, occurredAt: o.occurredAt, status: o.status, reportingOverdue: o.deadline.overdue })),
    hazards: haz.map((h) => ({ status: h.status, residualBand: h.residualBand, reviewOverdue: h.review === "overdue" })),
    deviations: devs.map((d) => ({ deviationCode: d.deviationCode, createdAt: d.createdAt.toISOString() })),
  });
}
