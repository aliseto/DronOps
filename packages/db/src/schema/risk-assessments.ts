import { pgTable, text, uuid, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { orgId, primaryId, timestamps } from "./_shared";
import { tenantPolicies } from "./rls";
import { persons } from "./persons";
import { missions } from "./missions";
import { formTemplates } from "./form-templates";
import { signatures } from "./signatures";

/**
 * M3 Safety — mission risk assessment (S-03). A JSA attached to a mission for a
 * specific flight profile (vlos/evlos/bvlos/night/populated). It PINS the M1 form
 * template version it was built from (rule 6 — a template change never mutates a
 * captured assessment); `data` holds the filled hazard/mitigation/residual rows.
 *
 * `draft` → editable. Approval is a signature ceremony (ops/accountable manager):
 * it binds a signature and flips status to `approved`, making the record
 * IMMUTABLE (enforce_risk_assessment_immutability). Only an APPROVED assessment
 * satisfies the mission approval gate (riskAssessmentGate); corrections are a new
 * assessment.
 */
export const riskAssessments = pgTable(
  "risk_assessments",
  {
    id: primaryId(),
    orgId: orgId(),
    code: text("code").notNull(), // RA-001
    missionId: uuid("mission_id").notNull().references(() => missions.id),
    profile: text("profile").$type<"vlos" | "evlos" | "bvlos" | "night" | "populated">().notNull(),
    title: text("title").notNull(),
    // Pinned M1 template version (nullable — an assessment may be ad-hoc).
    templateId: uuid("template_id").references(() => formTemplates.id),
    templateCode: text("template_code"),
    templateVersion: integer("template_version"),
    // Filled assessment: { hazards: [{ hazard, mitigation, residual }], notes }.
    data: jsonb("data"),
    // Lightweight residual band; the full 5×5 matrix is the S-02 register.
    residualRisk: text("residual_risk").$type<"low" | "medium" | "high">(),
    status: text("status").$type<"draft" | "approved">().notNull().default("draft"),
    approvedByPersonId: uuid("approved_by_person_id").references(() => persons.id),
    signatureId: uuid("signature_id").references(() => signatures.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index("risk_assessments_org_mission_idx").on(t.orgId, t.missionId),
    ...tenantPolicies("risk_assessments"),
  ],
).enableRLS();
