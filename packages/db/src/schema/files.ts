import { pgTable, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { orgId, primaryId } from "./_shared";
import { tenantPolicies } from "./rls";

/**
 * Evidence files — immutable + SHA-256 content-addressed (CLAUDE.md rule 7).
 * The storage key IS the hash: tenant/{org}/sha256/{hash}. Duplicate uploads
 * dedupe by (org_id, sha256). Append-only (forbid_update_delete trigger).
 */
export const files = pgTable(
  "files",
  {
    id: primaryId(),
    orgId: orgId(),
    sha256: text("sha256").notNull(),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    originalName: text("original_name"),
    storageKey: text("storage_key").notNull(),
    grade: text("grade").$type<"telemetry" | "cloud" | "manual">(),
    uploadedBy: text("uploaded_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("files_org_sha256_idx").on(t.orgId, t.sha256), ...tenantPolicies("files")],
).enableRLS();
