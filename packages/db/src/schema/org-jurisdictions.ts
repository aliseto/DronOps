import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { orgId, primaryId, timestamps } from "./_shared";
import { tenantPolicies } from "./rls";

/**
 * Per-org enabled jurisdictions (DRO-REG-001 §2). jurisdiction_key is a string
 * referencing packages/content keys — no enum, no hardcoded regulator logic.
 * Enabled = disabled_at IS NULL (toggling is soft; no hard deletes).
 */
export const orgJurisdictions = pgTable(
  "org_jurisdictions",
  {
    id: primaryId(),
    orgId: orgId(),
    jurisdictionKey: text("jurisdiction_key").notNull(),
    enabledBy: text("enabled_by"),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("org_jurisdictions_org_key_idx").on(t.orgId, t.jurisdictionKey),
    ...tenantPolicies("org_jurisdictions"),
  ],
).enableRLS();
