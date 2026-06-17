import { and, desc, eq, isNull } from "drizzle-orm";
import { schema } from "@dom/db";
import { withRls } from "@/lib/db";
import { claimsOf, type ActiveContext } from "./context";

export async function listOperations(ctx: ActiveContext) {
  return withRls(claimsOf(ctx), async (db) => ({
    missions: await db
      .select()
      .from(schema.operations)
      .where(isNull(schema.operations.archivedAt))
      .orderBy(desc(schema.operations.createdAt)),
    projects: await db.select().from(schema.projects).where(isNull(schema.projects.archivedAt)),
    clients: await db.select().from(schema.clients).where(isNull(schema.clients.archivedAt)),
    flights: await db.select().from(schema.flights).orderBy(desc(schema.flights.createdAt)),
  }));
}

export type OperationsData = Awaited<ReturnType<typeof listOperations>>;

export function createClient(ctx: ActiveContext, v: { company: string; industry?: string }) {
  return withRls(claimsOf(ctx), (db) => db.insert(schema.clients).values({ tenantId: ctx.tenantId, ...v }));
}

export function createProject(ctx: ActiveContext, v: { name: string; description?: string; clientId?: string }) {
  return withRls(claimsOf(ctx), (db) => db.insert(schema.projects).values({ orgId: ctx.orgId, ...v }));
}

export function createMission(
  ctx: ActiveContext,
  v: { title: string; projectId?: string; operationCategory?: string; plannedStart?: string },
) {
  return withRls(claimsOf(ctx), (db) =>
    db.insert(schema.operations).values({
      orgId: ctx.orgId,
      type: "mission",
      title: v.title,
      projectId: v.projectId,
      operationCategory: v.operationCategory,
      plannedStart: v.plannedStart ? new Date(v.plannedStart) : undefined,
    }),
  );
}

/** Submit for the regulator: draft → planned. */
export function submitMission(ctx: ActiveContext, id: string) {
  return withRls(claimsOf(ctx), (db) =>
    db
      .update(schema.operations)
      .set({ status: "planned", submittedBy: ctx.userId, submittedAt: new Date() })
      .where(and(eq(schema.operations.id, id), eq(schema.operations.orgId, ctx.orgId), eq(schema.operations.status, "draft"))),
  );
}

/** Record the external regulator approval → approved. */
export function recordApproval(
  ctx: ActiveContext,
  id: string,
  v: { approvingAuthority: string; approvalReference: string; approvedAt?: string },
) {
  return withRls(claimsOf(ctx), (db) =>
    db
      .update(schema.operations)
      .set({
        status: "approved",
        approvingAuthority: v.approvingAuthority,
        approvalReference: v.approvalReference,
        approvedAt: v.approvedAt ? new Date(v.approvedAt) : new Date(),
        approvedBy: ctx.userId,
      })
      .where(and(eq(schema.operations.id, id), eq(schema.operations.orgId, ctx.orgId))),
  );
}

export function completeMission(ctx: ActiveContext, id: string) {
  return withRls(claimsOf(ctx), (db) =>
    db
      .update(schema.operations)
      .set({ status: "completed" })
      .where(and(eq(schema.operations.id, id), eq(schema.operations.orgId, ctx.orgId))),
  );
}

export function cancelMission(ctx: ActiveContext, id: string, reason: string) {
  return withRls(claimsOf(ctx), (db) =>
    db
      .update(schema.operations)
      .set({ status: "cancelled", cancellationReason: reason })
      .where(and(eq(schema.operations.id, id), eq(schema.operations.orgId, ctx.orgId))),
  );
}
