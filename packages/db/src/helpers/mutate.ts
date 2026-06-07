import "server-only";
import type { AppDatabase } from "../client";
import { withTenant, type TenantCtx } from "./with-tenant";
import { withAudit, type AuditEntry } from "./with-audit";
import type { Tx } from "../client";

/**
 * The ONE sanctioned write path: tenant context + atomic audit in a single
 * transaction. Domain services should use this rather than calling db.insert /
 * db.update directly, so an audit row can never be forgotten.
 */
export async function mutate<T>(
  db: AppDatabase,
  ctx: TenantCtx,
  entry: AuditEntry | ((result: T) => AuditEntry),
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return withTenant(db, ctx, (tx) => withAudit<T>(tx, ctx, entry, fn));
}
