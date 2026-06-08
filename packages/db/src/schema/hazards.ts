import { pgTable, text, uuid, integer, timestamp, index } from "drizzle-orm/pg-core";
import { orgId, primaryId, timestamps } from "./_shared";
import { tenantPolicies } from "./rls";
import { persons } from "./persons";

/**
 * M3 Safety — hazard / risk register (S-02). A living SMS log: each hazard
 * carries its inherent risk (severity × likelihood on the 5×5 matrix), the
 * mitigations, the residual risk after mitigation, and a review cycle. Hazards
 * are NOT sealed — they are continuously re-reviewed — but hard deletes are
 * forbidden (no delete policy; retire via status) and every change is audited.
 *
 * `source` records provenance: a manual entry, an escalation from an occurrence,
 * or a recurring flight-deviation type (sourceRef = the deviation code) — the
 * deviation→risk connection that turns repeated one-off findings into a managed
 * register entry.
 */
export const hazards = pgTable(
  "hazards",
  {
    id: primaryId(),
    orgId: orgId(),
    code: text("code").notNull(), // HAZ-001
    title: text("title").notNull(),
    description: text("description"),
    category: text("category"), // operational | technical | environmental | human | external | other
    source: text("source").$type<"manual" | "recurring_deviation" | "occurrence">().notNull().default("manual"),
    sourceRef: text("source_ref"), // deviation code or occurrence id
    status: text("status").$type<"open" | "monitored" | "closed">().notNull().default("open"),
    ownerPersonId: uuid("owner_person_id").references(() => persons.id),
    // Inherent risk (1–5 each on the 5×5 matrix).
    likelihood: integer("likelihood"),
    severity: integer("severity"),
    // Mitigations + residual risk after mitigation.
    mitigations: text("mitigations"),
    residualLikelihood: integer("residual_likelihood"),
    residualSeverity: integer("residual_severity"),
    // Review cycle.
    reviewIntervalDays: integer("review_interval_days"),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
    nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index("hazards_org_status_idx").on(t.orgId, t.status),
    ...tenantPolicies("hazards"),
  ],
).enableRLS();
