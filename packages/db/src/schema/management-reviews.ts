import { pgTable, text, uuid, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { orgId, primaryId, timestamps } from "./_shared";
import { tenantPolicies } from "./rls";
import { persons } from "./persons";
import { signatures } from "./signatures";

/**
 * Management review (ISO 9001 §9.3) — the OPERATIONAL/aviation QMS review. A
 * dated, period-scoped record that pulls the §9.3 operational inputs (audit +
 * coverage, nonconformities + CAPA, operational performance, resource adequacy)
 * into one place alongside the narrative inputs (prior-action follow-up, customer
 * safety feedback, risk/opportunity effectiveness, improvements) and the review
 * outputs. The accountable manager e-signs (Tier-3 ceremony) → status `signed`,
 * which freezes `inputsSnapshot` and makes the record IMMUTABLE
 * (enforce_management_review_immutability) — prior reviews stay viewable like
 * obsolete documents. No commercial/financial inputs by design.
 */
export const managementReviews = pgTable(
  "management_reviews",
  {
    id: primaryId(),
    orgId: orgId(),
    code: text("code").notNull(), // MR-001
    title: text("title"),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    status: text("status").$type<"draft" | "signed">().notNull().default("draft"),
    // Narrative §9.3.2 inputs (operational) + §9.3.3 outputs.
    priorActions: text("prior_actions"),
    customerFeedback: text("customer_feedback"), // safety/service signals only
    riskEffectiveness: text("risk_effectiveness"),
    improvements: text("improvements"),
    resourceNotes: text("resource_notes"),
    outputs: text("outputs"),
    // Auto-assembled metrics, frozen at signing.
    inputsSnapshot: jsonb("inputs_snapshot"),
    // Tier-3 signature (accountable manager).
    signedByPersonId: uuid("signed_by_person_id").references(() => persons.id),
    signatureId: uuid("signature_id").references(() => signatures.id),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index("management_reviews_org_status_idx").on(t.orgId, t.status),
    ...tenantPolicies("management_reviews"),
  ],
).enableRLS();
