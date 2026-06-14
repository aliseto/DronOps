import { pgTable, text, uuid, timestamp, integer, jsonb, numeric, index } from "drizzle-orm/pg-core";
import { orgId, primaryId, timestamps } from "./_shared";
import { tenantPolicies } from "./rls";
import { persons } from "./persons";
import { aircraft } from "./aircraft";

/**
 * M6 Flight Evidence. A flight record bound to one aircraft and (one)
 * jurisdiction. Telemetry-derived metrics come from the parser (packages/parsers);
 * `evidenceFileId` is the immutable, content-addressed log. `deviations` is the
 * engine output computed at reconcile (the "every flight audits itself" inputs).
 *
 * Lifecycle draft → reconciled → sealed. Sealed is immutable
 * (enforce_sealed_immutability trigger). Not append-only before sealing: a draft
 * may be corrected; corrections after sealing are new records.
 */
export const flightRecords = pgTable(
  "flight_records",
  {
    id: primaryId(),
    orgId: orgId(),
    aircraftId: uuid("aircraft_id")
      .notNull()
      .references(() => aircraft.id),
    pilotPersonId: uuid("pilot_person_id").references(() => persons.id),
    jurisdiction: text("jurisdiction"), // content key; the record binds one
    missionRef: text("mission_ref"), // M4 links the mission later
    flownAt: timestamp("flown_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    durationSec: integer("duration_sec"),
    blockTimeSec: integer("block_time_sec"),
    maxAltitudeM: numeric("max_altitude_m"),
    maxDistanceM: numeric("max_distance_m"),
    minBatteryPct: integer("min_battery_pct"),
    sampleCount: integer("sample_count"),
    ceilingM: numeric("ceiling_m"), // applicable ceiling captured at reconcile
    source: text("source").$type<"dji-csv" | "manual">().notNull().default("dji-csv"),
    evidenceFileId: uuid("evidence_file_id"),
    deviations: jsonb("deviations"),
    status: text("status")
      .$type<"draft" | "reconciled" | "sealed">()
      .notNull()
      .default("draft"),
    reconciledByPersonId: uuid("reconciled_by_person_id").references(() => persons.id),
    sealedAt: timestamp("sealed_at", { withTimezone: true }),
    signatureId: uuid("signature_id"),
    ...timestamps(),
  },
  (t) => [
    index("flight_records_org_aircraft_idx").on(t.orgId, t.aircraftId, t.flownAt),
    ...tenantPolicies("flight_records"),
  ],
).enableRLS();
