import { pgTable, text, pgPolicy } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { primaryId, timestamps } from "./_shared";
import { appUser } from "./roles";

/**
 * Tenant root. RLS is keyed on the row's own id (not org_id): a member sees
 * only their active org. Rows are created via the admin client during
 * onboarding (the creating user has no org yet), so there is no app_user
 * INSERT policy — RLS denies inserts for the request-path role.
 */
export const organizations = pgTable(
  "organizations",
  {
    id: primaryId(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    createdBy: text("created_by"),
    ...timestamps(),
  },
  () => [
    pgPolicy("organizations_self_select", {
      as: "permissive",
      to: appUser,
      for: "select",
      using: sql`id = current_setting('app.current_org_id', true)::uuid`,
    }),
    pgPolicy("organizations_self_update", {
      as: "permissive",
      to: appUser,
      for: "update",
      using: sql`id = current_setting('app.current_org_id', true)::uuid`,
      withCheck: sql`id = current_setting('app.current_org_id', true)::uuid`,
    }),
  ],
).enableRLS();
