import { pgTable, text, uuid, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { orgId, primaryId, timestamps } from "./_shared";
import { tenantPolicies } from "./rls";
import { persons } from "./persons";

/**
 * Requirement coverage assessment (M2, C-01/C-02). One row per (org, requirement)
 * the org has assessed — status + the controlling document that evidences it +
 * a note, asserted by quality. Requirements with no row default to `gap`
 * (computed in @dronops/shared coverageStatusOf), so this table stores only what's
 * been reviewed. `requirementRef` is the content seed id (e.g. "CAR-UAC:UAC.045");
 * regulation is content, so we store the ref string, not an FK.
 *
 * A living assessment (updates allowed + audited); not append-only. A gap can be
 * escalated to an audit finding (source = 'audit').
 */
export const requirementCoverage = pgTable(
  "requirement_coverage",
  {
    id: primaryId(),
    orgId: orgId(),
    requirementRef: text("requirement_ref").notNull(), // content seed id
    status: text("status").$type<"covered" | "partial" | "gap" | "n-a">().notNull().default("gap"),
    controllingDocumentId: uuid("controlling_document_id"), // the document that evidences it
    note: text("note"),
    reviewedByPersonId: uuid("reviewed_by_person_id").references(() => persons.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("requirement_coverage_unique_idx").on(t.orgId, t.requirementRef),
    index("requirement_coverage_org_status_idx").on(t.orgId, t.status),
    ...tenantPolicies("requirement_coverage"),
  ],
).enableRLS();
