/**
 * Drizzle query schema — a hand-maintained mirror of the raw SQL migrations
 * (0001 + 0002 + 0003). This is used ONLY for typed queries from the app; the
 * authoritative DDL/RLS/triggers live in ../../migrations/*.sql. Keep names and
 * columns in sync with those files. Only the tables the app reads/writes in
 * Phase 0 are mirrored here.
 */
import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const tenantRole = pgEnum("tenant_role", ["owner", "group_admin"]);
export const orgRole = pgEnum("org_role", [
  "org_admin",
  "ops_manager",
  "pilot",
  "maintenance",
  "viewer",
  "hse_manager",
  "qc_manager",
]);
export const inviteStatus = pgEnum("invite_status", ["pending", "accepted", "revoked", "expired"]);
export const notificationTrigger = pgEnum("notification_trigger", [
  "document_expiry",
  "low_currency",
  "mission_overdue",
  "inspection_overdue",
  "part_replacement_overdue",
  "night_flight",
]);

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  branding: jsonb("branding").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  fullName: text("full_name"),
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const regulators = pgTable("regulators", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  name: text("name").notNull(),
});

export const organisations = pgTable("organisations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: text("name").notNull(),
  homeCountry: text("home_country"),
  primaryRegulatorId: uuid("primary_regulator_id"),
  jurisdiction: text("jurisdiction"),
  legalName: text("legal_name"),
  tradeLicenseNo: text("trade_license_no"),
  status: text("status").notNull().default("active"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const organisationRegulators = pgTable("organisation_regulators", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  regulatorId: uuid("regulator_id").notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
});

export const userTenantRoles = pgTable("user_tenant_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  tenantId: uuid("tenant_id").notNull(),
  role: tenantRole("role").notNull(),
});

export const userOrgRoles = pgTable("user_org_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  orgId: uuid("org_id").notNull(),
  role: orgRole("role").notNull(),
});

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  orgId: uuid("org_id"),
  email: text("email").notNull(),
  role: text("role").notNull(),
  tokenHash: text("token_hash").notNull(),
  status: inviteStatus("status").notNull().default("pending"),
  invitedBy: uuid("invited_by"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedUserId: uuid("accepted_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orgSettings = pgTable("org_settings", {
  orgId: uuid("org_id").primaryKey(),
  currencyWindowDays: integer("currency_window_days").notNull().default(90),
  mobilisationBufferMin: integer("mobilisation_buffer_min").notNull().default(30),
  dutyMaxMin: integer("duty_max_min").notNull().default(780),
  flightMaxMin: integer("flight_max_min").notNull().default(240),
  restMinMin: integer("rest_min_min").notNull().default(480),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  trigger: notificationTrigger("trigger"),
  title: text("title").notNull(),
  body: text("body"),
  targetUserId: uuid("target_user_id"),
  targetPersonnelId: uuid("target_personnel_id"),
  status: text("status").notNull().default("unread"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationPreferences = pgTable("notification_preferences", {
  userId: uuid("user_id").notNull(),
  trigger: notificationTrigger("trigger").notNull(),
  inApp: boolean("in_app").notNull().default(true),
  email: boolean("email").notNull().default(false),
});

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  company: text("company").notNull(),
  industry: text("industry"),
  website: text("website"),
  notes: text("notes"),
  status: text("status").notNull().default("active"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const missionTypes = pgTable("mission_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: text("name").notNull(),
  isCustom: boolean("is_custom").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id"),
  orgId: uuid("org_id"),
  actor: uuid("actor"),
  entity: text("entity").notNull(),
  entityId: uuid("entity_id"),
  action: text("action").notNull(),
  before: jsonb("before"),
  after: jsonb("after"),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});

// ── M1 Fleet & Inventory (profile → instance) ───────────────────────────────

export const droneProfiles = pgTable("drone_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  defaultType: text("default_type"),
  airframeType: text("airframe_type"),
  propulsion: text("propulsion"),
  defaultWeightG: numeric("default_weight_g"),
  defaultMaxDimM: numeric("default_max_dim_m"),
  maxSpeedMs: numeric("max_speed_ms"),
  remoteIdCapable: boolean("remote_id_capable").default(false),
  defaultSpecs: jsonb("default_specs").notNull().default({}),
  defaultInspectionConfig: jsonb("default_inspection_config").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const drones = pgTable("drones", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  profileId: uuid("profile_id"),
  name: text("name").notNull(),
  serial: text("serial"),
  registration: text("registration"),
  systemNumber: text("system_number"),
  dateAdded: date("date_added"),
  remoteId: text("remote_id"),
  colour: text("colour"),
  mtomG: numeric("mtom_g"),
  maxDimM: numeric("max_dim_m"),
  maxSpeedMs: numeric("max_speed_ms"),
  propulsion: text("propulsion"),
  totalFlightHours: numeric("total_flight_hours").notNull().default("0"),
  status: text("status").notNull().default("active"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const batteryProfiles = pgTable("battery_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  brand: text("brand"),
  model: text("model"),
  batteryType: text("battery_type"),
  capacityMah: numeric("capacity_mah"),
  voltageV: numeric("voltage_v"),
  cycleLimit: integer("cycle_limit"),
  healthCheckRecommendation: text("health_check_recommendation"),
  compatibleAircraft: jsonb("compatible_aircraft").notNull().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const batteries = pgTable("batteries", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  profileId: uuid("profile_id"),
  serial: text("serial"),
  systemNumber: text("system_number"),
  dateAdded: date("date_added"),
  status: text("status").notNull().default("active"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const controllerProfiles = pgTable("controller_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  brand: text("brand"),
  model: text("model"),
  type: text("type"),
  firmware: text("firmware"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const controllers = pgTable("controllers", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  profileId: uuid("profile_id"),
  rcSerial: text("rc_serial"),
  systemNumber: text("system_number"),
  dateAdded: date("date_added"),
  pairedAircraftId: uuid("paired_aircraft_id"),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const equipmentProfiles = pgTable("equipment_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  brand: text("brand"),
  model: text("model"),
  category: text("category"),
  maintenanceSchedule: text("maintenance_schedule"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const equipment = pgTable("equipment", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  profileId: uuid("profile_id"),
  name: text("name").notNull(),
  type: text("type"),
  serial: text("serial"),
  systemNumber: text("system_number"),
  dateAdded: date("date_added"),
  status: text("status").notNull().default("active"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  ownerType: text("owner_type").notNull(),
  ownerId: uuid("owner_id"),
  title: text("title").notNull(),
  docType: text("doc_type"),
  storagePath: text("storage_path"),
  issuedOn: date("issued_on"),
  expiresOn: date("expires_on"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── M2 Personnel & Crew ──────────────────────────────────────────────────────

export const personnel = pgTable("personnel", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  profileId: uuid("profile_id"),
  systemNumber: text("system_number"),
  fullName: text("full_name").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  roleTitle: text("role_title"),
  email: text("email"),
  phone: text("phone"),
  employmentType: text("employment_type"),
  nationality: text("nationality"),
  status: text("status").notNull().default("active"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const certifications = pgTable("certifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  personnelId: uuid("personnel_id").notNull(),
  type: text("type").notNull(),
  scope: text("scope"),
  issuer: text("issuer"),
  number: text("number"),
  issuedOn: date("issued_on"),
  expiresOn: date("expires_on"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id"),
  category: text("category").notNull(),
  name: text("name").notNull(),
  isCustom: boolean("is_custom").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const personnelSkills = pgTable("personnel_skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  personnelId: uuid("personnel_id").notNull(),
  skillId: uuid("skill_id").notNull(),
  level: text("level"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const approvedAircraft = pgTable("approved_aircraft", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  personnelId: uuid("personnel_id").notNull(),
  droneProfileId: uuid("drone_profile_id").notNull(),
  dateApproved: date("date_approved"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── M3 Operations & Flight Log ───────────────────────────────────────────────

export const operationType = pgEnum("operation_type", ["flight", "mission"]);
export const operationStatus = pgEnum("operation_status", [
  "draft",
  "planned",
  "approved",
  "completed",
  "cancelled",
]);

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  refCode: text("ref_code"),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  clientId: uuid("client_id"),
  projectLeadId: uuid("project_lead_id"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const operations = pgTable("operations", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  projectId: uuid("project_id"),
  refCode: text("ref_code"),
  type: operationType("type").notNull(),
  title: text("title").notNull(),
  status: operationStatus("status").notNull().default("draft"),
  operationCategory: text("operation_category"),
  plannedStart: timestamp("planned_start", { withTimezone: true }),
  plannedEnd: timestamp("planned_end", { withTimezone: true }),
  maxAltitudeM: numeric("max_altitude_m"),
  siteName: text("site_name"),
  submittedBy: uuid("submitted_by"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  approvingAuthority: text("approving_authority"),
  approvalReference: text("approval_reference"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  approvedBy: uuid("approved_by"),
  cancellationReason: text("cancellation_reason"),
  descriptor: jsonb("descriptor").notNull().default({}),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const flights = pgTable("flights", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  operationId: uuid("operation_id"),
  projectId: uuid("project_id"),
  refCode: text("ref_code"),
  pilotPersonnelId: uuid("pilot_personnel_id"),
  droneId: uuid("drone_id"),
  batteryId: uuid("battery_id"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  durationS: integer("duration_s"),
  isNight: boolean("is_night").notNull().default(false),
  source: text("source").notNull().default("manual"),
  siteName: text("site_name"),
  maxAltitudeM: numeric("max_altitude_m"),
  hasDeviation: boolean("has_deviation").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
