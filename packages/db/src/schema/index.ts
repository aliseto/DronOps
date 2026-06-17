/**
 * Drizzle query schema — a hand-maintained mirror of the raw SQL migrations
 * (0001 + 0002 + 0003). This is used ONLY for typed queries from the app; the
 * authoritative DDL/RLS/triggers live in ../../migrations/*.sql. Keep names and
 * columns in sync with those files. Only the tables the app reads/writes in
 * Phase 0 are mirrored here.
 */
import {
  boolean,
  integer,
  jsonb,
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
