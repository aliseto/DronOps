import { pgTable, text, uuid, timestamp, index } from "drizzle-orm/pg-core";
import { orgId, primaryId, timestamps } from "./_shared";
import { tenantPolicies } from "./rls";
import { persons } from "./persons";
import { missions } from "./missions";
import { flightRecords } from "./flight-records";
import { aircraft } from "./aircraft";
import { findings } from "./findings";

/**
 * M3 Safety — occurrence reports (S-01/S-05): incidents, accidents and hazard
 * observations. Anyone can file in seconds; filing from a mission context
 * auto-links the mission, flight log, aircraft and pilot. `occurred_at` anchors
 * the jurisdiction reporting clock (DRO-REG §6 — bound per record, never
 * harmonized); `reported_at` preserves the field-capture timestamp on offline
 * sync. The record drives the deadline countdown (occurrenceDeadlineStatus),
 * carries the investigation (S-05), and can ESCALATE to an M2 finding
 * (escalated_finding_id) where the cause is systemic.
 *
 * Append-only + audited; once `closed` the record is IMMUTABLE
 * (enforce_occurrence_immutability) — corrections are new occurrences.
 */
export const occurrences = pgTable(
  "occurrences",
  {
    id: primaryId(),
    orgId: orgId(),
    code: text("code").notNull(), // OCC-001
    classification: text("classification").$type<"incident" | "accident" | "hazard_observation">().notNull(),
    title: text("title").notNull(),
    description: text("description"),
    // Jurisdiction binds the reporting deadline rule — ONE per record (rule 3).
    jurisdiction: text("jurisdiction").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    // Field-capture timestamp; preserved across offline sync (S-01 acceptance).
    reportedAt: timestamp("reported_at", { withTimezone: true }).notNull().defaultNow(),
    reportedByPersonId: uuid("reported_by_person_id").references(() => persons.id),
    // Auto-links when filed from a mission context (S-01).
    missionId: uuid("mission_id").references(() => missions.id),
    flightRecordId: uuid("flight_record_id").references(() => flightRecords.id),
    aircraftId: uuid("aircraft_id").references(() => aircraft.id),
    pilotPersonId: uuid("pilot_person_id").references(() => persons.id),
    // Regulator reporting clock, computed from deadlineFor at filing.
    reportingDueAt: timestamp("reporting_due_at", { withTimezone: true }),
    reportingClause: text("reporting_clause"),
    reportedToRegulatorAt: timestamp("reported_to_regulator_at", { withTimezone: true }),
    // Investigation (S-05).
    status: text("status").$type<"open" | "investigating" | "closed">().notNull().default("open"),
    investigationSummary: text("investigation_summary"),
    rootCause: text("root_cause"),
    // Escalation to M2.
    escalatedFindingId: uuid("escalated_finding_id").references(() => findings.id),
    escalatedAt: timestamp("escalated_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    closedByPersonId: uuid("closed_by_person_id").references(() => persons.id),
    ...timestamps(),
  },
  (t) => [
    index("occurrences_org_status_idx").on(t.orgId, t.status),
    ...tenantPolicies("occurrences"),
  ],
).enableRLS();
