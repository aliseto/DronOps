import { pgTable, jsonb, text, uniqueIndex } from "drizzle-orm/pg-core";
import { orgId, primaryId, timestamps } from "./_shared";
import { tenantPolicies } from "./rls";

/** Per-org manual-suite template parameters (spec §1). Audited; one row per org. */
export const orgTemplateParams = pgTable(
  "org_template_params",
  {
    id: primaryId(),
    orgId: orgId(),
    params: jsonb("params").notNull(),
    updatedBy: text("updated_by"),
    ...timestamps(),
  },
  (t) => [uniqueIndex("org_template_params_org_idx").on(t.orgId), ...tenantPolicies("org_template_params")],
).enableRLS();
