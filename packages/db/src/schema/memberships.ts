import { pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { orgId, primaryId, timestamps } from "./_shared";
import { tenantPolicies } from "./rls";

/**
 * User ↔ org link — this is where tenancy lives (the auth users table is
 * tenancy-free). Invites are rows with status 'invited' and a null user_id
 * until accepted. Org-scoped (RLS via org_id).
 */
export const memberships = pgTable(
  "memberships",
  {
    id: primaryId(),
    orgId: orgId(),
    userId: text("user_id"), // null until an invite is accepted
    email: text("email").notNull(),
    role: text("role").$type<"owner" | "admin" | "member">().notNull().default("member"),
    status: text("status").$type<"active" | "invited">().notNull().default("active"),
    invitedBy: text("invited_by"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("memberships_org_email_idx").on(t.orgId, t.email),
    ...tenantPolicies("memberships"),
  ],
).enableRLS();
