import { pgTable, text, uuid, timestamp, numeric, uniqueIndex, index } from "drizzle-orm/pg-core";
import { orgId, primaryId, timestamps } from "./_shared";
import { tenantPolicies } from "./rls";
import { persons } from "./persons";

/**
 * M5 Fleet. An aircraft (UA) the org operates. `airframeClass` is the unit M7
 * operator-recency is scoped to. `registrationJurisdiction` is a content key (the
 * record binds one jurisdiction — never an enum). `condition` is the stored base
 * state; the engine derives "due-soon" from the registration window. Mutable +
 * audited.
 */
export const aircraft = pgTable(
  "aircraft",
  {
    id: primaryId(),
    orgId: orgId(),
    label: text("label").notNull(),
    identifier: text("identifier"), // serial number
    airframeClass: text("airframe_class").notNull(),
    manufacturer: text("manufacturer"),
    model: text("model"),
    gacaClass: text("gaca_class"), // five-class label when KSA-registered
    registrationNo: text("registration_no"),
    registrationJurisdiction: text("registration_jurisdiction"),
    registrationIssuedAt: timestamp("registration_issued_at", { withTimezone: true }),
    registrationExpiresAt: timestamp("registration_expires_at", { withTimezone: true }),
    firmwareVersion: text("firmware_version"),
    condition: text("condition")
      .$type<"operational" | "in_maintenance" | "grounded">()
      .notNull()
      .default("operational"),
    conditionNote: text("condition_note"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("aircraft_org_identifier_idx").on(t.orgId, t.identifier),
    ...tenantPolicies("aircraft"),
  ],
).enableRLS();

/** GCS / payloads / batteries registered with an aircraft (DCAA/GCAA asset set). */
export const aircraftComponents = pgTable(
  "aircraft_components",
  {
    id: primaryId(),
    orgId: orgId(),
    aircraftId: uuid("aircraft_id")
      .notNull()
      .references(() => aircraft.id),
    kind: text("kind").notNull(),
    label: text("label").notNull(),
    serialNo: text("serial_no"),
    firmwareVersion: text("firmware_version"),
    notes: text("notes"),
    ...timestamps(),
  },
  (t) => [
    index("aircraft_components_org_aircraft_idx").on(t.orgId, t.aircraftId),
    ...tenantPolicies("aircraft_components"),
  ],
).enableRLS();

/**
 * Maintenance logbook (AC 107-01 schema is the superset). APPEND-ONLY
 * (forbid_update_delete trigger in migration): a logbook entry is a record;
 * corrections are new entries. Evidence attaches via an immutable file.
 */
export const maintenanceRecords = pgTable(
  "maintenance_records",
  {
    id: primaryId(),
    orgId: orgId(),
    aircraftId: uuid("aircraft_id")
      .notNull()
      .references(() => aircraft.id),
    type: text("type").notNull(),
    performedAt: timestamp("performed_at", { withTimezone: true }).notNull(),
    description: text("description").notNull(),
    performedByPersonId: uuid("performed_by_person_id").references(() => persons.id),
    performedByName: text("performed_by_name"), // external technician (no person record)
    hoursAtService: numeric("hours_at_service"),
    nextDueAt: timestamp("next_due_at", { withTimezone: true }),
    evidenceFileId: uuid("evidence_file_id"),
    ...timestamps(),
  },
  (t) => [
    index("maintenance_records_org_aircraft_idx").on(t.orgId, t.aircraftId, t.performedAt),
    ...tenantPolicies("maintenance_records"),
  ],
).enableRLS();
