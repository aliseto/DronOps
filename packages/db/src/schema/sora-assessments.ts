import { pgTable, text, uuid, integer, timestamp, index } from "drizzle-orm/pg-core";
import { orgId, primaryId, timestamps } from "./_shared";
import { tenantPolicies } from "./rls";
import { persons } from "./persons";
import { missions } from "./missions";
import { signatures } from "./signatures";

/**
 * M3 Safety — SORA assessment (S-04). A JARUS SORA 2.0 specific-category risk
 * assessment: the operational inputs (scenario, UA dimension, M1–M3 mitigations,
 * air-risk class + reduction) and the deterministic determination (intrinsic /
 * final GRC, residual ARC, SAIL — see determineSora). May attach to a mission.
 *
 * `draft` → inputs editable, the determination renders live. Approval is a
 * signature ceremony (ops/accountable manager): it freezes the determination,
 * binds a signature and makes the record IMMUTABLE
 * (enforce_sora_immutability). Corrections are a new assessment.
 */
export const soraAssessments = pgTable(
  "sora_assessments",
  {
    id: primaryId(),
    orgId: orgId(),
    code: text("code").notNull(), // SORA-001
    title: text("title").notNull(),
    missionId: uuid("mission_id").references(() => missions.id),
    // Inputs.
    scenario: text("scenario").notNull(),
    dimension: text("dimension").notNull(),
    m1: text("m1").notNull().default("none"),
    m2: text("m2").notNull().default("none"),
    m3: text("m3").notNull().default("none"),
    initialArc: text("initial_arc").notNull(),
    arcReduction: integer("arc_reduction").notNull().default(0),
    // Determination, frozen at approval.
    intrinsicGrc: integer("intrinsic_grc"),
    finalGrc: integer("final_grc"),
    residualArc: text("residual_arc"),
    sail: integer("sail"),
    status: text("status").$type<"draft" | "approved">().notNull().default("draft"),
    approvedByPersonId: uuid("approved_by_person_id").references(() => persons.id),
    signatureId: uuid("signature_id").references(() => signatures.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index("sora_assessments_org_status_idx").on(t.orgId, t.status),
    ...tenantPolicies("sora_assessments"),
  ],
).enableRLS();
