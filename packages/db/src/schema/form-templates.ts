import { pgTable, text, uuid, integer, jsonb, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { orgId, primaryId, timestamps } from "./_shared";
import { tenantPolicies } from "./rls";

/**
 * Versioned form templates (PR-014). A template family is identified by `code`;
 * each version is its own immutable row once active/retired. Editing an active
 * version creates version n+1 and retires n. Instances pin a template version,
 * so a template change never mutates captured instances.
 */
export const formTemplates = pgTable(
  "form_templates",
  {
    id: primaryId(),
    orgId: orgId(),
    code: text("code").notNull(),
    version: integer("version").notNull(),
    title: text("title").notNull(),
    appliesTo: text("applies_to").notNull().default("generic"),
    status: text("status").$type<"draft" | "active" | "retired">().notNull().default("draft"),
    schema: jsonb("schema").notNull(),
    supersededByVersionId: uuid("superseded_by_version_id"),
    supersededAt: timestamp("superseded_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("form_templates_org_code_version_idx").on(t.orgId, t.code, t.version),
    ...tenantPolicies("form_templates"),
  ],
).enableRLS();

/** A filled-in form. Pins the exact template version it was captured against. */
export const formInstances = pgTable(
  "form_instances",
  {
    id: primaryId(),
    orgId: orgId(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => formTemplates.id),
    templateCode: text("template_code").notNull(),
    templateVersion: integer("template_version").notNull(),
    missionId: uuid("mission_id"),
    data: jsonb("data").notNull(),
    status: text("status").$type<"draft" | "submitted">().notNull().default("draft"),
    capturedAt: timestamp("captured_at", { withTimezone: true }),
    syncedAt: timestamp("synced_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index("form_instances_template_idx").on(t.orgId, t.templateId),
    ...tenantPolicies("form_instances"),
  ],
).enableRLS();
