import { pgPolicy } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { appUser } from "./roles";

/**
 * Reusable tenant-isolation policies for an org-scoped table. A row is visible /
 * writable only when its org_id equals the per-transaction GUC set by
 * withTenant (custom GUC — NOT Supabase Auth helpers).
 *
 * Deliberately NO delete policy: hard deletes are forbidden (CLAUDE.md rule 1).
 * Corrections are new audit events; soft-delete uses a status/deleted_at column.
 */
export const tenantPolicies = (table: string) => [
  pgPolicy(`${table}_tenant_select`, {
    as: "permissive",
    to: appUser,
    for: "select",
    using: sql`org_id = current_setting('app.current_org_id', true)::uuid`,
  }),
  pgPolicy(`${table}_tenant_insert`, {
    as: "permissive",
    to: appUser,
    for: "insert",
    withCheck: sql`org_id = current_setting('app.current_org_id', true)::uuid`,
  }),
  pgPolicy(`${table}_tenant_update`, {
    as: "permissive",
    to: appUser,
    for: "update",
    using: sql`org_id = current_setting('app.current_org_id', true)::uuid`,
    withCheck: sql`org_id = current_setting('app.current_org_id', true)::uuid`,
  }),
];
