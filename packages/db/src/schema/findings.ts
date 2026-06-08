import { pgTable, text, uuid, timestamp, index } from "drizzle-orm/pg-core";
import { orgId, primaryId, timestamps } from "./_shared";
import { tenantPolicies } from "./rls";
import { persons } from "./persons";

/**
 * M2 Compliance — findings (NCRs / observations) and their CAPA actions. The
 * deviation→finding loop: a sealed flight's deviations auto-raise findings here
 * with the flight log pre-attached as evidence (source = 'flight_deviation').
 *
 * Lifecycle (StatusPill `ncr` vocab): open → containment → capa-in-progress →
 * verify → closed, with false-positive as a triage off-ramp. Level + CAPA due
 * window come from content (capaRuleFor). Closed / false-positive are immutable;
 * segregation of duties (raiser ≠ closure verifier, Hard Rule 4) is enforced by
 * the enforce_finding_sod trigger — not the UI.
 */
export const findings = pgTable(
  "findings",
  {
    id: primaryId(),
    orgId: orgId(),
    code: text("code").notNull(), // NCR-001
    jurisdiction: text("jurisdiction"), // content key; the finding binds one
    source: text("source").$type<"flight_deviation" | "audit" | "manual" | "occurrence">().notNull(),
    sourceRef: text("source_ref"), // flight_records.id (auto-raised) / occurrences.id (escalated)
    deviationCode: text("deviation_code"), // ceiling_exceedance | low_battery | …
    level: text("level").$type<"major" | "minor" | "observation">().notNull(),
    severity: text("severity").$type<"high" | "medium" | "low">(),
    status: text("status")
      .$type<"open" | "containment" | "capa-in-progress" | "verify" | "closed" | "false-positive">()
      .notNull()
      .default("open"),
    title: text("title").notNull(),
    description: text("description"),
    evidenceFileId: uuid("evidence_file_id"), // the content-addressed sealed flight log
    raisedByPersonId: uuid("raised_by_person_id").references(() => persons.id),
    dueAt: timestamp("due_at", { withTimezone: true }), // CAPA due (content-driven)
    // Triage of an auto-raised finding (C-04).
    triagedAt: timestamp("triaged_at", { withTimezone: true }),
    triageDecision: text("triage_decision").$type<"accept" | "downgrade" | "false-positive">(),
    triageReason: text("triage_reason"),
    // Closure (SoD-guarded).
    verifiedByPersonId: uuid("verified_by_person_id").references(() => persons.id),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index("findings_org_status_idx").on(t.orgId, t.status),
    ...tenantPolicies("findings"),
  ],
).enableRLS();

/** CAPA actions on a finding (containment / corrective / preventive). */
export const capaActions = pgTable(
  "capa_actions",
  {
    id: primaryId(),
    orgId: orgId(),
    findingId: uuid("finding_id")
      .notNull()
      .references(() => findings.id),
    kind: text("kind").$type<"containment" | "corrective" | "preventive">().notNull(),
    description: text("description").notNull(),
    ownerPersonId: uuid("owner_person_id").references(() => persons.id),
    dueAt: timestamp("due_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index("capa_actions_org_finding_idx").on(t.orgId, t.findingId),
    ...tenantPolicies("capa_actions"),
  ],
).enableRLS();
