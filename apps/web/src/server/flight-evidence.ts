import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getAdminDb, withTenant, type TenantCtx, type Tx } from "@dronops/db";
import { auditEvents, aircraft, flightRecords, persons } from "@dronops/db/schema";
import { parseFlightCsv } from "@dronops/parsers";
import {
  applicableCeilingM,
  flightDeviations,
  sha256Hex,
  type FlightDeviation,
  type Jurisdiction,
} from "@dronops/shared";
import { uploadEvidence } from "./files";

type FlightRow = typeof flightRecords.$inferSelect;

async function audit(
  tx: Tx,
  ctx: TenantCtx,
  e: { action: string; entityType: string; entityId?: string; before?: unknown; after?: unknown },
) {
  await tx.insert(auditEvents).values({
    orgId: ctx.orgId,
    actorUserId: ctx.userId,
    action: e.action,
    entityType: e.entityType,
    entityId: e.entityId,
    before: e.before ?? null,
    after: e.after ?? null,
    amr: "password",
  });
}

const n = (v: unknown): number | null => (v == null ? null : Number(v));

/**
 * Ingest a flight from a telemetry CSV (DJI flight-record / Airdata export). The
 * log is stored content-addressed (PR-011 evidence), then a DRAFT flight_record
 * is created with the parser's derived metrics. Reconcile binds jurisdiction +
 * pilot and computes deviations.
 *
 * ── SEAM ── Real DJI .DAT and validation of the parser against real logs are
 * held; this runs on the CSV path + synthetic fixtures. Recency/duty wiring into
 * M7 stays "awaiting M6" until that validation lands.
 */
export async function ingestFlight(
  ctx: TenantCtx,
  input: { aircraftId: string; csvText: string; fileName?: string; jurisdiction?: string; pilotPersonId?: string },
) {
  const parsed = parseFlightCsv(input.csvText);
  const bytes = new TextEncoder().encode(input.csvText);
  const sha256 = await sha256Hex(bytes);
  const { file } = await uploadEvidence(ctx, {
    sha256,
    bytes,
    mime: "text/csv",
    size: bytes.length,
    name: input.fileName,
    grade: "telemetry",
  });

  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [f] = await tx
      .insert(flightRecords)
      .values({
        orgId: ctx.orgId,
        aircraftId: input.aircraftId,
        pilotPersonId: input.pilotPersonId,
        jurisdiction: input.jurisdiction,
        flownAt: parsed.startedAt,
        endedAt: parsed.endedAt,
        durationSec: parsed.durationSec,
        blockTimeSec: parsed.blockTimeSec,
        maxAltitudeM: String(parsed.maxAltitudeM),
        maxDistanceM: String(parsed.maxDistanceM),
        minBatteryPct: parsed.minBatteryPct,
        sampleCount: parsed.sampleCount,
        source: "dji-csv",
        evidenceFileId: file.id,
        status: "draft",
      })
      .returning();
    if (!f) throw new Error("flight insert failed");
    await audit(tx, ctx, {
      action: "flight_record.ingest",
      entityType: "flight_record",
      entityId: f.id,
      after: { aircraftId: input.aircraftId, sampleCount: parsed.sampleCount, warnings: parsed.warnings },
    });
    return { flight: f, warnings: parsed.warnings };
  });
}

/**
 * Reconcile: bind jurisdiction + pilot, capture the applicable ceiling, and
 * compute deviations (the auto-raised-nonconformity inputs). The auto-raise into
 * M2/M3 NCR/CAPA is the documented seam — deviations are stored here.
 */
export async function reconcileFlight(
  ctx: TenantCtx,
  id: string,
  input: { jurisdiction?: string; pilotPersonId?: string; ceilingOverrideM?: number },
) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [f] = await tx
      .select()
      .from(flightRecords)
      .where(and(eq(flightRecords.orgId, ctx.orgId), eq(flightRecords.id, id)))
      .limit(1);
    if (!f) throw new Error("flight not found");
    if (f.status === "sealed") throw new Error("sealed flights are immutable");

    const jurisdiction = (input.jurisdiction ?? f.jurisdiction) as Jurisdiction | null;
    const ceilingM = applicableCeilingM(jurisdiction, input.ceilingOverrideM ?? null);
    const deviations: FlightDeviation[] = flightDeviations({
      maxAltitudeM: Number(f.maxAltitudeM ?? 0),
      minBatteryPct: f.minBatteryPct,
      jurisdiction,
      ceilingOverrideM: input.ceilingOverrideM ?? null,
    });

    await tx
      .update(flightRecords)
      .set({
        jurisdiction: jurisdiction ?? f.jurisdiction,
        pilotPersonId: input.pilotPersonId ?? f.pilotPersonId,
        ceilingM: ceilingM != null ? String(ceilingM) : null,
        deviations,
        status: "reconciled",
        reconciledByPersonId: input.pilotPersonId ?? f.reconciledByPersonId,
        updatedAt: new Date(),
      })
      .where(eq(flightRecords.id, id));
    await audit(tx, ctx, {
      action: "flight_record.reconcile",
      entityType: "flight_record",
      entityId: id,
      after: { jurisdiction, deviationCount: deviations.length },
    });
    // SEAM(M6→M7): on validated real-flight ingestion, emit recency_events
    // (source 'm6_flight') and per-day block time here. Held until real-log
    // validation — the M7 seams stay "awaiting M6".
    return deviations;
  });
}

/** Seal a reconciled flight — immutable thereafter (enforce_sealed_immutability). */
export async function sealFlight(ctx: TenantCtx, id: string) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [f] = await tx
      .select()
      .from(flightRecords)
      .where(and(eq(flightRecords.orgId, ctx.orgId), eq(flightRecords.id, id)))
      .limit(1);
    if (!f) throw new Error("flight not found");
    if (f.status !== "reconciled") throw new Error("only reconciled flights can be sealed");
    await tx
      .update(flightRecords)
      .set({ status: "sealed", sealedAt: new Date(), updatedAt: new Date() })
      .where(eq(flightRecords.id, id));
    await audit(tx, ctx, {
      action: "flight_record.seal",
      entityType: "flight_record",
      entityId: id,
      before: { status: "reconciled" },
      after: { status: "sealed" },
    });
  });
}

// ───────────────────────────────────────────────────────────────── queries
export interface FlightListItem {
  id: string;
  aircraftLabel: string;
  flownAt: string;
  durationSec: number | null;
  maxAltitudeM: number | null;
  status: string;
  deviationCount: number;
}

export async function listFlights(orgId: string): Promise<FlightListItem[]> {
  const db = getAdminDb();
  const rows = await db
    .select({ f: flightRecords, aircraftLabel: aircraft.label })
    .from(flightRecords)
    .innerJoin(aircraft, eq(aircraft.id, flightRecords.aircraftId))
    .where(eq(flightRecords.orgId, orgId))
    .orderBy(desc(flightRecords.flownAt));
  return rows.map(({ f, aircraftLabel }) => ({
    id: f.id,
    aircraftLabel,
    flownAt: f.flownAt.toISOString(),
    durationSec: f.durationSec,
    maxAltitudeM: n(f.maxAltitudeM),
    status: f.status,
    deviationCount: Array.isArray(f.deviations) ? (f.deviations as unknown[]).length : 0,
  }));
}

export interface FlightDetail {
  flight: {
    id: string;
    aircraftLabel: string;
    pilotName: string | null;
    jurisdiction: string | null;
    flownAt: string;
    durationSec: number | null;
    blockTimeSec: number | null;
    maxAltitudeM: number | null;
    maxDistanceM: number | null;
    minBatteryPct: number | null;
    sampleCount: number | null;
    ceilingM: number | null;
    status: string;
    source: string;
    evidenceFileId: string | null;
  };
  deviations: FlightDeviation[];
}

export async function getFlightDetail(orgId: string, id: string): Promise<FlightDetail | null> {
  const db = getAdminDb();
  const [row] = await db
    .select({ f: flightRecords, aircraftLabel: aircraft.label })
    .from(flightRecords)
    .innerJoin(aircraft, eq(aircraft.id, flightRecords.aircraftId))
    .where(and(eq(flightRecords.orgId, orgId), eq(flightRecords.id, id)))
    .limit(1);
  if (!row) return null;
  const f = row.f as FlightRow;
  let pilotName: string | null = null;
  if (f.pilotPersonId) {
    const [p] = await db.select({ name: persons.name }).from(persons).where(eq(persons.id, f.pilotPersonId)).limit(1);
    pilotName = p?.name ?? null;
  }
  return {
    flight: {
      id: f.id,
      aircraftLabel: row.aircraftLabel,
      pilotName,
      jurisdiction: f.jurisdiction,
      flownAt: f.flownAt.toISOString(),
      durationSec: f.durationSec,
      blockTimeSec: f.blockTimeSec,
      maxAltitudeM: n(f.maxAltitudeM),
      maxDistanceM: n(f.maxDistanceM),
      minBatteryPct: f.minBatteryPct,
      sampleCount: f.sampleCount,
      ceilingM: n(f.ceilingM),
      status: f.status,
      source: f.source,
      evidenceFileId: f.evidenceFileId,
    },
    deviations: Array.isArray(f.deviations) ? (f.deviations as FlightDeviation[]) : [],
  };
}
