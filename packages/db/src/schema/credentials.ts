import { pgTable, text, uuid, timestamp, integer, boolean, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { orgId, primaryId, timestamps } from "./_shared";
import { tenantPolicies } from "./rls";
import { persons } from "./persons";

/**
 * M7 credential wallet. Each row is one instrument a person holds; `kind` is a
 * content code (CREDENTIAL_KINDS in @dronops/content), `jurisdiction` a content
 * key — never an enum, never hardcoded. Mutable (renewals/corrections) but every
 * mutation is audited; `verified` distinguishes operator-confirmed external
 * credentials from self-asserted ones (the currency engine treats unverified as
 * unconfirmed). Evidence attaches via document_file_id (immutable file).
 */
export const credentials = pgTable(
  "credentials",
  {
    id: primaryId(),
    orgId: orgId(),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id),
    kind: text("kind").notNull(),
    jurisdiction: text("jurisdiction"), // content key, null = cross-jurisdiction
    authority: text("authority"),
    credentialNo: text("credential_no"),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }), // null = standing
    verified: boolean("verified").notNull().default(false),
    verifiedByPersonId: uuid("verified_by_person_id").references(() => persons.id),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    documentFileId: uuid("document_file_id"),
    status: text("status")
      .$type<"active" | "superseded" | "revoked">()
      .notNull()
      .default("active"),
    notes: text("notes"),
    ...timestamps(),
  },
  (t) => [
    index("credentials_org_person_idx").on(t.orgId, t.personId),
    ...tenantPolicies("credentials"),
  ],
).enableRLS();

/**
 * Recency events feeding the currency engine. APPEND-ONLY (forbid_update_delete
 * trigger in migration): a flight that happened, happened. `event_type` is
 * "flight" for the operator recency rule, or a gate eventType (e.g.
 * "knowledge_recency"). `airframe_class` scopes the operator rule per class.
 *
 * ── M6 SEAM ── M6 flight reconciliation writes rows with source "m6_flight" and
 * source_ref = the flight id. Until M6 lands these are created manually / by
 * import; the engine consumes events regardless of source, so M6 wiring is an
 * insert path only — M7 does not block on it.
 */
export const recencyEvents = pgTable(
  "recency_events",
  {
    id: primaryId(),
    orgId: orgId(),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id),
    eventType: text("event_type").notNull(),
    airframeClass: text("airframe_class"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    source: text("source")
      .$type<"manual" | "import" | "m6_flight">()
      .notNull()
      .default("manual"),
    sourceRef: text("source_ref"),
    recordedByPersonId: uuid("recorded_by_person_id").references(() => persons.id),
    ...timestamps(),
  },
  (t) => [
    index("recency_events_org_person_type_idx").on(t.orgId, t.personId, t.eventType),
    uniqueIndex("recency_events_m6_dedup_idx")
      .on(t.orgId, t.source, t.sourceRef, t.eventType)
      .where(sql`source = 'm6_flight' and source_ref is not null`),
    ...tenantPolicies("recency_events"),
  ],
).enableRLS();

/**
 * Duty records (DUOSAM duty/rest engine, UAE-Dubai). Historical or planned; the
 * duty engine projects breaches over these. Mutable + audited.
 */
export const dutyRecords = pgTable(
  "duty_records",
  {
    id: primaryId(),
    orgId: orgId(),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    missionRef: text("mission_ref"),
    planned: boolean("planned").notNull().default(false),
    /** Additional flight areas beyond the first — drives the OSO#17 duty reduction. */
    extraFlightAreas: integer("extra_flight_areas").notNull().default(0),
    notes: text("notes"),
    ...timestamps(),
  },
  (t) => [
    index("duty_records_org_person_idx").on(t.orgId, t.personId, t.startAt),
    ...tenantPolicies("duty_records"),
  ],
).enableRLS();

/**
 * Per-org currency configuration (one row per org). Holds the operator recency
 * override (orgs may TIGHTEN the content default) and a jsonb for duty-scheme
 * overrides once the OSO#17 values land. NULL columns → engine uses the content
 * default.
 */
export const orgCurrencyRules = pgTable(
  "org_currency_rules",
  {
    id: primaryId(),
    orgId: orgId(),
    operatorMinFlights: integer("operator_min_flights"),
    operatorWindowDays: integer("operator_window_days"),
    operatorPerAirframeClass: boolean("operator_per_airframe_class"),
    dutyOverrides: jsonb("duty_overrides"),
    updatedBy: text("updated_by"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("org_currency_rules_org_idx").on(t.orgId),
    ...tenantPolicies("org_currency_rules"),
  ],
).enableRLS();
