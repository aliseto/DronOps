import { timestamp, uuid } from "drizzle-orm/pg-core";

/** created_at / updated_at, timestamptz, UTC. Factory so each table gets its own
 * column builders (never share a builder instance between tables). */
export const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** The tenant key present on every org-scoped table; RLS policies key off it. */
export const orgId = () => uuid("org_id").notNull();

export const primaryId = () => uuid("id").primaryKey().defaultRandom();
