import "server-only";
import { withTenant, getAdminDb, type TenantCtx } from "@dronops/db";
import { auditEvents } from "@dronops/db/schema";

/** Downloads of documents (incl. obsolete revisions) are audit-logged. */
export async function logFileAccess(ctx: TenantCtx, fileId: string, documentId: string) {
  await withTenant(getAdminDb(), ctx, async (tx) => {
    await tx.insert(auditEvents).values({
      orgId: ctx.orgId,
      actorUserId: ctx.userId,
      action: "file.download",
      entityType: "document",
      entityId: documentId,
      after: { fileId },
      amr: "password",
    });
  });
}
