import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getAdminDb } from "@dronops/db";
import { auditEvents } from "@dronops/db/schema";
import type { TimelineEvent } from "@dronops/ui";

/** Audit trail for any entity, newest first — feeds the generic HistoryDrawer. */
export async function getEntityHistory(
  orgId: string,
  entityType: string,
  entityId: string,
): Promise<TimelineEvent[]> {
  const rows = await getAdminDb()
    .select()
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.orgId, orgId),
        eq(auditEvents.entityType, entityType),
        eq(auditEvents.entityId, entityId),
      ),
    )
    .orderBy(desc(auditEvents.createdAt))
    .limit(100);

  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    actor: r.actorUserId,
    at: r.createdAt.toISOString(),
  }));
}
