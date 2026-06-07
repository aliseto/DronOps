import { pgTable, text, uuid, boolean, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { orgId, primaryId, timestamps } from "./_shared";
import { tenantPolicies } from "./rls";
import { documentRevisions } from "./documents";
import { persons } from "./persons";

/**
 * Distribution of a specific revision to an audience (a role or a person), with
 * an optional ack requirement + due date. Acks are tracked per person (PR-013).
 */
export const documentDistributions = pgTable(
  "document_distributions",
  {
    id: primaryId(),
    orgId: orgId(),
    revisionId: uuid("revision_id")
      .notNull()
      .references(() => documentRevisions.id),
    audienceType: text("audience_type").$type<"role" | "person">().notNull(),
    /** role key (DOMAIN_ROLES) when type=role, or a person id when type=person. */
    audienceRef: text("audience_ref").notNull(),
    ackRequired: boolean("ack_required").notNull().default(true),
    dueAt: timestamp("due_at", { withTimezone: true }),
    createdBy: text("created_by"),
    ...timestamps(),
  },
  (t) => [
    index("document_distributions_revision_idx").on(t.orgId, t.revisionId),
    ...tenantPolicies("document_distributions"),
  ],
).enableRLS();

/** Per-person acknowledgement of a distribution. Append-only (immutable record). */
export const documentAcks = pgTable(
  "document_acks",
  {
    id: primaryId(),
    orgId: orgId(),
    distributionId: uuid("distribution_id")
      .notNull()
      .references(() => documentDistributions.id),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id),
    ackedAt: timestamp("acked_at", { withTimezone: true }).notNull().defaultNow(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("document_acks_dist_person_idx").on(t.orgId, t.distributionId, t.personId),
    ...tenantPolicies("document_acks"),
  ],
).enableRLS();
