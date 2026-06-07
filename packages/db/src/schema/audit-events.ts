import { pgTable, uuid, text, jsonb, timestamp, index, primaryKey } from "drizzle-orm/pg-core";
import { orgId } from "./_shared";
import { tenantPolicies } from "./rls";

/**
 * Append-only audit log. Every domain mutation writes one row here in the SAME
 * transaction as the mutation (see withAudit). Insert-only is enforced by a
 * trigger (forbid_update_delete) in the bootstrap migration — not just RLS.
 *
 * Partitioned BY RANGE (created_at), monthly, from day one (applied at the DB
 * level — Drizzle can't express PARTITION BY). The PK therefore includes the
 * partition key (id, created_at).
 */
export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").notNull().defaultRandom(),
    orgId: orgId(),
    actorUserId: uuid("actor_user_id"), // null = system / background job
    action: text("action").notNull(), // e.g. "organization.create"
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    before: jsonb("before"), // null on create
    after: jsonb("after"), // null on soft-delete
    amr: text("amr"), // "password" | "webauthn" | "system"
    context: jsonb("context"), // ip, ua, requestId, signatureRef…
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.id, t.createdAt] }),
    index("audit_events_org_created_idx").on(t.orgId, t.createdAt),
    index("audit_events_entity_idx").on(t.orgId, t.entityType, t.entityId),
    ...tenantPolicies("audit_events"),
  ],
).enableRLS();
