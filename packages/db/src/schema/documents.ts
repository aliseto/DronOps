import { pgTable, text, uuid, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { orgId, primaryId, timestamps } from "./_shared";
import { tenantPolicies } from "./rls";
import { persons } from "./persons";

/**
 * M1 Documents. Six categories; external docs skip approval and track review-due.
 * doc_no is server-generated per category (or a custom legacy number), unique
 * per org. current_revision_id points at the effective revision (no FK to avoid
 * a circular constraint with document_revisions).
 */
export const documents = pgTable(
  "documents",
  {
    id: primaryId(),
    orgId: orgId(),
    category: text("category").notNull(),
    docNo: text("doc_no").notNull(),
    title: text("title").notNull(),
    ownerPersonId: uuid("owner_person_id").references(() => persons.id),
    jurisdictionTags: text("jurisdiction_tags").array(),
    currentRevisionId: uuid("current_revision_id"),
    reviewDueAt: timestamp("review_due_at", { withTimezone: true }), // external docs
    ...timestamps(),
  },
  (t) => [uniqueIndex("documents_org_docno_idx").on(t.orgId, t.docNo), ...tenantPolicies("documents")],
).enableRLS();

/**
 * Revision lifecycle draft → in_review → approved → obsolete. Approved/obsolete
 * are immutable except the single approved→obsolete supersede transition,
 * enforced by enforce_doc_revision_immutability (migration). Obsolete is forever
 * viewable.
 */
export const documentRevisions = pgTable(
  "document_revisions",
  {
    id: primaryId(),
    orgId: orgId(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id),
    revNo: integer("rev_no").notNull(),
    changeSummary: text("change_summary"),
    bodyFileId: uuid("body_file_id"),
    bodyRich: text("body_rich"),
    status: text("status").$type<"draft" | "in_review" | "approved" | "obsolete">()
      .notNull()
      .default("draft"),
    effectiveAt: timestamp("effective_at", { withTimezone: true }),
    approvedByPersonId: uuid("approved_by_person_id").references(() => persons.id),
    signatureId: uuid("signature_id"),
    supersededByRevisionId: uuid("superseded_by_revision_id"),
    supersededAt: timestamp("superseded_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("document_revisions_org_doc_rev_idx").on(t.orgId, t.documentId, t.revNo),
    ...tenantPolicies("document_revisions"),
  ],
).enableRLS();

/** Document ↔ requirement links (content refs). Soft-removed (removed_at), no deletes. */
export const documentRequirements = pgTable(
  "document_requirements",
  {
    id: primaryId(),
    orgId: orgId(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id),
    requirementRef: text("requirement_ref").notNull(),
    removedAt: timestamp("removed_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("document_requirements_active_idx")
      .on(t.orgId, t.documentId, t.requirementRef)
      .where(sql`removed_at is null`),
    ...tenantPolicies("document_requirements"),
  ],
).enableRLS();

/** Per-org monotonic counters (e.g. document numbering per category). */
export const counters = pgTable(
  "counters",
  {
    id: primaryId(),
    orgId: orgId(),
    key: text("key").notNull(),
    value: integer("value").notNull().default(0),
    ...timestamps(),
  },
  (t) => [uniqueIndex("counters_org_key_idx").on(t.orgId, t.key), ...tenantPolicies("counters")],
).enableRLS();
