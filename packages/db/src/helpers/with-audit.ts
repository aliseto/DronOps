import "server-only";
import type { Tx } from "../client";
import type { TenantCtx } from "./with-tenant";
import { auditEvents } from "../schema/audit-events";

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  amr?: "password" | "webauthn" | "system";
  signatureRef?: string;
}

/**
 * Performs a domain mutation and writes its audit row in the SAME transaction.
 * Runs inside the Tx from withTenant (does not open its own) so the mutation
 * and audit insert are atomic — one rolls back the other. The audit entry may
 * be a function of the mutation result (e.g. to capture a generated id).
 */
export async function withAudit<T>(
  tx: Tx,
  ctx: TenantCtx,
  entry: AuditEntry | ((result: T) => AuditEntry),
  mutate: (tx: Tx) => Promise<T>,
): Promise<T> {
  const result = await mutate(tx);
  const e = typeof entry === "function" ? (entry as (r: T) => AuditEntry)(result) : entry;
  await tx.insert(auditEvents).values({
    orgId: ctx.orgId,
    actorUserId: ctx.userId,
    action: e.action,
    entityType: e.entityType,
    entityId: e.entityId,
    before: e.before ?? null,
    after: e.after ?? null,
    amr: e.amr ?? "system",
    context: e.signatureRef ? { signatureRef: e.signatureRef } : null,
  });
  return result;
}
