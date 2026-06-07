import { pgTable, text, uuid, timestamp, numeric, boolean, uniqueIndex, index } from "drizzle-orm/pg-core";
import { orgId, primaryId, timestamps } from "./_shared";
import { tenantPolicies } from "./rls";
import { persons } from "./persons";
import { aircraft } from "./aircraft";

/**
 * M4 Operations. A mission binds ONE jurisdiction and ONE operationalCategory
 * (derived from its authorization basis) — the input the no-mixing requirement
 * gate and the duty-applicability gate both read. `ceilingM` prefills from the
 * jurisdiction default. Oman approval-basis (AWR 033 permit) lives in the
 * authorization* fields + mission_locations + the green-zone / media-attribution
 * conditions.
 *
 * Lifecycle draft → pending_approval → approved → in_progress → reconciling →
 * sealed. Unlike documents, 'approved' stays mutable (it progresses); only
 * 'sealed' is immutable (enforce_mission_seal trigger in the migration).
 */
export const missions = pgTable(
  "missions",
  {
    id: primaryId(),
    orgId: orgId(),
    code: text("code").notNull(), // server-numbered MIS-001 (or custom)
    title: text("title").notNull(),
    jurisdiction: text("jurisdiction").notNull(),
    operationalCategory: text("operational_category")
      .$type<"open" | "standard" | "specific" | "advanced">()
      .notNull(),
    aircraftId: uuid("aircraft_id").references(() => aircraft.id),
    plannedStartAt: timestamp("planned_start_at", { withTimezone: true }),
    plannedEndAt: timestamp("planned_end_at", { withTimezone: true }),
    ceilingM: numeric("ceiling_m"),
    // Authorization basis (jurisdiction-shaped; Oman = AWR 033 permit).
    authorizationType: text("authorization_type"), // new | extension | renewal (Oman); OA | UOC (KSA); …
    authorizationRef: text("authorization_ref"), // permit / OA number
    // Oman standing conditions.
    mediaAttribution: boolean("media_attribution").notNull().default(false),
    greenZoneConfirmedByPersonId: uuid("green_zone_confirmed_by_person_id").references(() => persons.id),
    greenZoneConfirmedAt: timestamp("green_zone_confirmed_at", { withTimezone: true }),
    status: text("status")
      .$type<"draft" | "pending_approval" | "approved" | "in_progress" | "reconciling" | "sealed">()
      .notNull()
      .default("draft"),
    approvedByPersonId: uuid("approved_by_person_id").references(() => persons.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    signatureId: uuid("signature_id"),
    notes: text("notes"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("missions_org_code_idx").on(t.orgId, t.code),
    index("missions_org_status_idx").on(t.orgId, t.status),
    ...tenantPolicies("missions"),
  ],
).enableRLS();

/**
 * Per-location rows for an Oman AWR 033 permit (governorate / wilayat / village,
 * lat-long, per-location ceiling ≤ 122 m). Other jurisdictions may use a single
 * site; this table carries the structured Oman permit locations.
 */
export const missionLocations = pgTable(
  "mission_locations",
  {
    id: primaryId(),
    orgId: orgId(),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missions.id),
    governorate: text("governorate"),
    wilayat: text("wilayat"),
    village: text("village"),
    latitude: numeric("latitude"),
    longitude: numeric("longitude"),
    ceilingM: numeric("ceiling_m"),
    ...timestamps(),
  },
  (t) => [
    index("mission_locations_org_mission_idx").on(t.orgId, t.missionId),
    ...tenantPolicies("mission_locations"),
  ],
).enableRLS();

/**
 * Crew assignment (mission × person × role). Currency + duty are evaluated
 * per-assignment at approval; a block is cleared only by a logged override
 * (reason + who + when → audit trail).
 */
export const missionCrew = pgTable(
  "mission_crew",
  {
    id: primaryId(),
    orgId: orgId(),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missions.id),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id),
    role: text("role").notNull(),
    overrideReason: text("override_reason"),
    overriddenByPersonId: uuid("overridden_by_person_id").references(() => persons.id),
    overriddenAt: timestamp("overridden_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("mission_crew_unique_idx").on(t.orgId, t.missionId, t.personId, t.role),
    ...tenantPolicies("mission_crew"),
  ],
).enableRLS();
