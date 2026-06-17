import { and, eq, isNull } from "drizzle-orm";
import { schema } from "@dom/db";
import { withRls } from "@/lib/db";
import { claimsOf, type ActiveContext } from "./context";

/** Everything the Fleet screen needs, RLS-scoped to the active org/tenant. */
export async function listFleet(ctx: ActiveContext) {
  return withRls(claimsOf(ctx), async (db) => ({
    aircraft: await db.select().from(schema.drones).where(isNull(schema.drones.archivedAt)),
    droneProfiles: await db.select().from(schema.droneProfiles),
    batteries: await db.select().from(schema.batteries).where(isNull(schema.batteries.archivedAt)),
    batteryProfiles: await db.select().from(schema.batteryProfiles),
    controllers: await db.select().from(schema.controllers).where(isNull(schema.controllers.archivedAt)),
    controllerProfiles: await db.select().from(schema.controllerProfiles),
    equipment: await db.select().from(schema.equipment).where(isNull(schema.equipment.archivedAt)),
    equipmentProfiles: await db.select().from(schema.equipmentProfiles),
  }));
}

export type FleetData = Awaited<ReturnType<typeof listFleet>>;

// ── creates (tenant-scoped profiles; org-scoped instances) ───────────────────

export function createDroneProfile(ctx: ActiveContext, v: { brand: string; model: string; airframeType?: string; propulsion?: string }) {
  return withRls(claimsOf(ctx), (db) =>
    db.insert(schema.droneProfiles).values({ tenantId: ctx.tenantId, ...v }),
  );
}
export function createAircraft(ctx: ActiveContext, v: { name: string; profileId?: string; serial?: string; registration?: string }) {
  return withRls(claimsOf(ctx), (db) =>
    db.insert(schema.drones).values({ orgId: ctx.orgId, ...v }),
  );
}

export function createBatteryProfile(ctx: ActiveContext, v: { brand?: string; model?: string; batteryType?: string }) {
  return withRls(claimsOf(ctx), (db) => db.insert(schema.batteryProfiles).values({ tenantId: ctx.tenantId, ...v }));
}
export function createBattery(ctx: ActiveContext, v: { profileId?: string; serial?: string }) {
  return withRls(claimsOf(ctx), (db) => db.insert(schema.batteries).values({ orgId: ctx.orgId, ...v }));
}

export function createControllerProfile(ctx: ActiveContext, v: { brand?: string; model?: string; type?: string }) {
  return withRls(claimsOf(ctx), (db) => db.insert(schema.controllerProfiles).values({ tenantId: ctx.tenantId, ...v }));
}
export function createController(ctx: ActiveContext, v: { profileId?: string; rcSerial?: string }) {
  return withRls(claimsOf(ctx), (db) => db.insert(schema.controllers).values({ orgId: ctx.orgId, ...v }));
}

export function createEquipmentProfile(ctx: ActiveContext, v: { brand?: string; model?: string; category?: string }) {
  return withRls(claimsOf(ctx), (db) => db.insert(schema.equipmentProfiles).values({ tenantId: ctx.tenantId, ...v }));
}
export function createEquipment(ctx: ActiveContext, v: { name: string; profileId?: string; serial?: string }) {
  return withRls(claimsOf(ctx), (db) => db.insert(schema.equipment).values({ orgId: ctx.orgId, ...v }));
}

type AssetKind = "aircraft" | "battery" | "controller" | "equipment";

/** Soft-archive an instance (no hard deletes). */
export function archiveAsset(ctx: ActiveContext, kind: AssetKind, id: string) {
  const at = new Date();
  return withRls(claimsOf(ctx), async (db) => {
    if (kind === "aircraft") {
      await db.update(schema.drones).set({ archivedAt: at }).where(and(eq(schema.drones.id, id), eq(schema.drones.orgId, ctx.orgId)));
    } else if (kind === "battery") {
      await db.update(schema.batteries).set({ archivedAt: at }).where(and(eq(schema.batteries.id, id), eq(schema.batteries.orgId, ctx.orgId)));
    } else if (kind === "controller") {
      await db.update(schema.controllers).set({ archivedAt: at }).where(and(eq(schema.controllers.id, id), eq(schema.controllers.orgId, ctx.orgId)));
    } else {
      await db.update(schema.equipment).set({ archivedAt: at }).where(and(eq(schema.equipment.id, id), eq(schema.equipment.orgId, ctx.orgId)));
    }
  });
}
