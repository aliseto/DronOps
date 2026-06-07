import { pgTable, text, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { orgId, primaryId, timestamps } from "./_shared";
import { tenantPolicies } from "./rls";
import { persons } from "./persons";

/**
 * Domain RBAC. Roles are a fixed code vocabulary (DOMAIN_ROLES in
 * @dronops/shared) referenced by string — modeled like jurisdiction keys, not a
 * tenant table — so there's no global PostgREST-exposed catalog. Role-guard
 * utilities read person_roles (NOT memberships.role: that's platform access).
 */
export const personRoles = pgTable(
  "person_roles",
  {
    id: primaryId(),
    orgId: orgId(),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id),
    role: text("role").notNull(),
    grantedBy: text("granted_by"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("person_roles_org_person_role_idx").on(t.orgId, t.personId, t.role),
    ...tenantPolicies("person_roles"),
  ],
).enableRLS();
