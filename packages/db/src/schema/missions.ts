import { pgTable, text, uuid, timestamp, numeric, boolean, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
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
 * Lifecycle on the SAME record (DronOps is the system of record, NOT the approval
 * system — the application is made on the authority portal, external to us):
 *   planning → submitted_for_approval → approval_in_progress → approved → ready
 *   → flown, with rejected/withdrawn as off-ramps from approval_in_progress.
 * Ops team owns planning→submitted; approval admin owns submitted→approved
 * (records the external application + uploads the returned approval). The crew
 * currency/duty gate activates only at approved → ready. 'flown' is the immutable
 * terminal (enforce_mission_seal trigger).
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
    // Declared flight profiles (vlos/evlos/bvlos/night/populated) — the input the
    // M3 risk-assessment gate reads to require a matching approved assessment.
    flightProfiles: jsonb("flight_profiles").$type<string[]>(),
    aircraftId: uuid("aircraft_id").references(() => aircraft.id),
    plannedStartAt: timestamp("planned_start_at", { withTimezone: true }),
    plannedEndAt: timestamp("planned_end_at", { withTimezone: true }),
    ceilingM: numeric("ceiling_m"),
    // External authority application (system-of-record only — never auto-submitted).
    authority: text("authority"), // DCAA | GCAA | CAA …
    applicationRef: text("application_ref"), // the authority portal application reference
    submittedAt: timestamp("submitted_at", { withTimezone: true }), // date submitted to the authority
    // Authorization basis = the returned approval (jurisdiction-shaped; Oman = AWR 033 permit).
    authorizationType: text("authorization_type"), // new | extension | renewal (Oman); OA | UOC (KSA); …
    authorizationRef: text("authorization_ref"), // returned permit / OA number
    // Oman standing conditions.
    mediaAttribution: boolean("media_attribution").notNull().default(false),
    greenZoneConfirmedByPersonId: uuid("green_zone_confirmed_by_person_id").references(() => persons.id),
    greenZoneConfirmedAt: timestamp("green_zone_confirmed_at", { withTimezone: true }),
    status: text("status")
      .$type<
        | "planning"
        | "submitted_for_approval"
        | "approval_in_progress"
        | "approved"
        | "ready"
        | "flown"
        | "rejected"
        | "withdrawn"
      >()
      .notNull()
      .default("planning"),
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

/**
 * Mission documents — content-addressed via the files system. INBOUND captured at
 * planning (AOI KML/KMZ, client-supplied docs, used to apply); OUTBOUND captured
 * at approved (the authority approval letter / permit, operator + sales-readable).
 * Append-only references; the underlying file is immutable.
 */
export const missionDocuments = pgTable(
  "mission_documents",
  {
    id: primaryId(),
    orgId: orgId(),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missions.id),
    fileId: uuid("file_id").notNull(),
    flow: text("flow").$type<"inbound" | "outbound">().notNull(),
    kind: text("kind").notNull(), // aoi | client_doc | approval_letter | permit | other
    label: text("label"),
    uploadedByPersonId: uuid("uploaded_by_person_id").references(() => persons.id),
    ...timestamps(),
  },
  (t) => [
    index("mission_documents_org_mission_idx").on(t.orgId, t.missionId, t.flow),
    ...tenantPolicies("mission_documents"),
  ],
).enableRLS();

/**
 * Mission activity thread — the history Timeline made writable. An append-only
 * operational log (NOT a chat): manual notes authored by ops_team / approval_admin,
 * interleaved at read time with the mission's own audit events. Optional content-
 * addressed file attachment (e.g. the authority's response letter). No edit/delete
 * (enforced by trigger), consistent with the audit ethos.
 */
export const missionNotes = pgTable(
  "mission_notes",
  {
    id: primaryId(),
    orgId: orgId(),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missions.id),
    authorPersonId: uuid("author_person_id").references(() => persons.id),
    body: text("body").notNull(),
    fileId: uuid("file_id"),
    ...timestamps(),
  },
  (t) => [
    index("mission_notes_org_mission_idx").on(t.orgId, t.missionId),
    ...tenantPolicies("mission_notes"),
  ],
).enableRLS();
