import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getAdminDb, withTenant, type TenantCtx, type Tx } from "@dronops/db";
import { auditEvents, aircraft, aircraftComponents, maintenanceRecords } from "@dronops/db/schema";
import { assetStatus, type AssetStatusResult } from "@dronops/shared";

type ComponentRow = typeof aircraftComponents.$inferSelect;
type MaintenanceRow = typeof maintenanceRecords.$inferSelect;

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

// ─────────────────────────────────────────────────────────── fleet roster
export interface FleetListItem {
  id: string;
  label: string;
  identifier: string | null;
  airframeClass: string;
  manufacturer: string | null;
  model: string | null;
  status: AssetStatusResult["status"];
  registrationStatus: AssetStatusResult["registration"]["status"];
  registrationExpiresAt: string | null;
  nextMaintenanceDueAt: string | null;
  maintenanceOverdue: boolean;
  componentCount: number;
}

const STATUS_RANK = { grounded: 3, "due-soon": 2, "in-maintenance": 1, operational: 0 } as const;

export async function listFleet(orgId: string): Promise<FleetListItem[]> {
  const db = getAdminDb();
  const [craft, comps, maint] = await Promise.all([
    db.select().from(aircraft).where(eq(aircraft.orgId, orgId)),
    db.select().from(aircraftComponents).where(eq(aircraftComponents.orgId, orgId)),
    db.select().from(maintenanceRecords).where(eq(maintenanceRecords.orgId, orgId)),
  ]);

  const compCount = new Map<string, number>();
  for (const c of comps) compCount.set(c.aircraftId, (compCount.get(c.aircraftId) ?? 0) + 1);
  const nextDue = new Map<string, Date[]>();
  for (const m of maint) {
    if (m.nextDueAt) (nextDue.get(m.aircraftId) ?? nextDue.set(m.aircraftId, []).get(m.aircraftId)!).push(m.nextDueAt);
  }

  const now = new Date();
  const items = craft.map((a) => {
    const st = assetStatus(a, now);
    const dues = nextDue.get(a.id) ?? [];
    const future = dues.filter((d) => d.getTime() >= now.getTime()).sort((x, y) => x.getTime() - y.getTime());
    const overdue = dues.some((d) => d.getTime() < now.getTime());
    return {
      id: a.id,
      label: a.label,
      identifier: a.identifier,
      airframeClass: a.airframeClass,
      manufacturer: a.manufacturer,
      model: a.model,
      status: st.status,
      registrationStatus: st.registration.status,
      registrationExpiresAt: a.registrationExpiresAt ? a.registrationExpiresAt.toISOString() : null,
      nextMaintenanceDueAt: future[0] ? future[0].toISOString() : null,
      maintenanceOverdue: overdue,
      componentCount: compCount.get(a.id) ?? 0,
    };
  });
  items.sort((x, y) => STATUS_RANK[y.status] - STATUS_RANK[x.status]);
  return items;
}

// ─────────────────────────────────────────────────────────── aircraft detail
export interface AircraftDetail {
  aircraft: {
    id: string;
    label: string;
    identifier: string | null;
    airframeClass: string;
    manufacturer: string | null;
    model: string | null;
    gacaClass: string | null;
    registrationNo: string | null;
    registrationJurisdiction: string | null;
    registrationExpiresAt: string | null;
    firmwareVersion: string | null;
    condition: string;
    conditionNote: string | null;
  };
  status: AssetStatusResult["status"];
  registration: {
    status: AssetStatusResult["registration"]["status"];
    daysUntilExpiry: number | null;
    clause?: string;
  };
  components: { id: string; kind: string; label: string; serialNo: string | null; firmwareVersion: string | null }[];
  maintenance: {
    id: string;
    type: string;
    performedAt: string;
    description: string;
    performedByName: string | null;
    nextDueAt: string | null;
  }[];
}

export async function getAircraftDetail(orgId: string, id: string): Promise<AircraftDetail | null> {
  const db = getAdminDb();
  const [a] = await db
    .select()
    .from(aircraft)
    .where(and(eq(aircraft.orgId, orgId), eq(aircraft.id, id)))
    .limit(1);
  if (!a) return null;
  const [comps, maint] = await Promise.all([
    db.select().from(aircraftComponents).where(and(eq(aircraftComponents.orgId, orgId), eq(aircraftComponents.aircraftId, id))),
    db
      .select()
      .from(maintenanceRecords)
      .where(and(eq(maintenanceRecords.orgId, orgId), eq(maintenanceRecords.aircraftId, id)))
      .orderBy(desc(maintenanceRecords.performedAt)),
  ]);
  const st = assetStatus(a, new Date());
  return {
    aircraft: {
      id: a.id,
      label: a.label,
      identifier: a.identifier,
      airframeClass: a.airframeClass,
      manufacturer: a.manufacturer,
      model: a.model,
      gacaClass: a.gacaClass,
      registrationNo: a.registrationNo,
      registrationJurisdiction: a.registrationJurisdiction,
      registrationExpiresAt: a.registrationExpiresAt ? a.registrationExpiresAt.toISOString() : null,
      firmwareVersion: a.firmwareVersion,
      condition: a.condition,
      conditionNote: a.conditionNote,
    },
    status: st.status,
    registration: {
      status: st.registration.status,
      daysUntilExpiry: st.registration.daysUntilExpiry,
      clause: st.registration.rule?.clause,
    },
    components: (comps as ComponentRow[]).map((c) => ({
      id: c.id,
      kind: c.kind,
      label: c.label,
      serialNo: c.serialNo,
      firmwareVersion: c.firmwareVersion,
    })),
    maintenance: (maint as MaintenanceRow[]).map((m) => ({
      id: m.id,
      type: m.type,
      performedAt: m.performedAt.toISOString(),
      description: m.description,
      performedByName: m.performedByName,
      nextDueAt: m.nextDueAt ? m.nextDueAt.toISOString() : null,
    })),
  };
}

// ───────────────────────────────────────────────────────────────── mutations
export interface AddAircraftInput {
  label: string;
  airframeClass: string;
  identifier?: string;
  manufacturer?: string;
  model?: string;
  gacaClass?: string;
  registrationNo?: string;
  registrationJurisdiction?: string;
  registrationExpiresAt?: Date;
  firmwareVersion?: string;
}

export async function addAircraft(ctx: TenantCtx, input: AddAircraftInput) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [a] = await tx
      .insert(aircraft)
      .values({ orgId: ctx.orgId, ...input })
      .returning();
    if (!a) throw new Error("aircraft insert failed");
    await audit(tx, ctx, { action: "aircraft.create", entityType: "aircraft", entityId: a.id, after: { label: input.label, identifier: input.identifier } });
    return a;
  });
}

export async function setAircraftCondition(
  ctx: TenantCtx,
  id: string,
  condition: "operational" | "in_maintenance" | "grounded",
  note?: string,
) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [before] = await tx
      .select({ condition: aircraft.condition })
      .from(aircraft)
      .where(and(eq(aircraft.orgId, ctx.orgId), eq(aircraft.id, id)))
      .limit(1);
    await tx
      .update(aircraft)
      .set({ condition, conditionNote: note, updatedAt: new Date() })
      .where(and(eq(aircraft.orgId, ctx.orgId), eq(aircraft.id, id)));
    await audit(tx, ctx, {
      action: "aircraft.set_condition",
      entityType: "aircraft",
      entityId: id,
      before: before ?? null,
      after: { condition, note },
    });
  });
}

export async function addComponent(
  ctx: TenantCtx,
  input: { aircraftId: string; kind: string; label: string; serialNo?: string; firmwareVersion?: string },
) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [c] = await tx.insert(aircraftComponents).values({ orgId: ctx.orgId, ...input }).returning();
    if (!c) throw new Error("component insert failed");
    await audit(tx, ctx, { action: "aircraft_component.create", entityType: "aircraft_component", entityId: c.id, after: { kind: input.kind, label: input.label } });
    return c;
  });
}

export async function logMaintenance(
  ctx: TenantCtx,
  input: {
    aircraftId: string;
    type: string;
    performedAt: Date;
    description: string;
    performedByName?: string;
    nextDueAt?: Date;
  },
) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [m] = await tx
      .insert(maintenanceRecords)
      .values({
        orgId: ctx.orgId,
        aircraftId: input.aircraftId,
        type: input.type,
        performedAt: input.performedAt,
        description: input.description,
        performedByName: input.performedByName,
        nextDueAt: input.nextDueAt,
      })
      .returning();
    if (!m) throw new Error("maintenance insert failed");
    await audit(tx, ctx, { action: "maintenance_record.create", entityType: "maintenance_record", entityId: m.id, after: { type: input.type, performedAt: input.performedAt } });
    return m;
  });
}
