import { z } from "zod";

/**
 * Fleet content vocabulary (DRO-REG-001 §8, M5). Like the rest of packages/content
 * this is versioned data the engine/UI read — never hardcoded in app code. The
 * DB stores the chosen codes as strings (no enums), so adding a class is a content
 * change, not a migration.
 */

/** Airframe class — the unit M7 operator-recency is scoped to (per class). */
export const AIRFRAME_CLASSES = [
  { code: "multirotor", label: "Multirotor" },
  { code: "fixed_wing", label: "Fixed-wing" },
  { code: "vtol", label: "VTOL / hybrid" },
  { code: "helicopter", label: "Helicopter" },
] as const;
export type AirframeClass = (typeof AIRFRAME_CLASSES)[number]["code"];

/**
 * GACA five-class UA classification by MTOM (GACAR / CAR-47). Native label shown
 * in UI; applies when KSA is the registration jurisdiction.
 */
export const GACA_AIRCRAFT_CLASSES = [
  { code: "class_1", label: "Class 1 — ≤ 250 g" },
  { code: "class_2", label: "Class 2 — > 250 g–4 kg" },
  { code: "class_3", label: "Class 3 — > 4–25 kg" },
  { code: "class_4", label: "Class 4 — > 25–150 kg" },
  { code: "class_5", label: "Class 5 — > 150 kg" },
] as const;

/** Sub-assets carried/used with an aircraft (registered together — DCAA/GCAA). */
export const COMPONENT_KINDS = [
  { code: "ground_station", label: "Ground control station" },
  { code: "payload", label: "Payload" },
  { code: "battery", label: "Battery" },
  { code: "other", label: "Other" },
] as const;
export type ComponentKind = (typeof COMPONENT_KINDS)[number]["code"];

/** Maintenance logbook entry types (AC 107-01 logbook schema is the superset). */
export const MAINTENANCE_TYPES = [
  { code: "scheduled_inspection", label: "Scheduled inspection" },
  { code: "repair", label: "Repair" },
  { code: "firmware_update", label: "Firmware update" },
  { code: "component_swap", label: "Component swap" },
  { code: "other", label: "Other" },
] as const;
export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number]["code"];

/** Base operational condition stored on an aircraft (due-soon is derived). */
export const AIRCRAFT_CONDITIONS = [
  { code: "operational", label: "Operational" },
  { code: "in_maintenance", label: "In maintenance" },
  { code: "grounded", label: "Grounded" },
] as const;
export type AircraftCondition = (typeof AIRCRAFT_CONDITIONS)[number]["code"];

/**
 * Safe-condition obligation references (engine notes, not numeric). Oman CAR-102
 * .180 requires the UA be maintained in a condition for safe operation; GACA
 * Part 48 carries the registration-expiry gate (in rules/gates.ts).
 */
export const SAFE_CONDITION_CLAUSE: Record<string, string> = {
  Oman: "CAR 102.180",
  KSA: "GACAR 107 / AC 107-01",
};

const codeLabel = z.object({ code: z.string().min(1), label: z.string().min(1) });
for (const set of [AIRFRAME_CLASSES, GACA_AIRCRAFT_CLASSES, COMPONENT_KINDS, MAINTENANCE_TYPES, AIRCRAFT_CONDITIONS]) {
  for (const v of set) codeLabel.parse(v);
}
