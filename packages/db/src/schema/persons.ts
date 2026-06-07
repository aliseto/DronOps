import { pgTable, text, uuid, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { orgId, primaryId, timestamps } from "./_shared";
import { tenantPolicies } from "./rls";

/**
 * Operational identity (a person in the operation) — distinct from access
 * identity (users/memberships). A person may exist without a user account
 * (e.g. a contractor pilot). Org-scoped; tenancy via org_id.
 */
export const persons = pgTable(
  "persons",
  {
    id: primaryId(),
    orgId: orgId(),
    identityNo: text("identity_no"), // unique per org when present
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    employmentStatus: text("employment_status")
      .$type<"active" | "inactive" | "left">()
      .notNull()
      .default("active"),
    employmentEndAt: timestamp("employment_end_at", { withTimezone: true }),
    photoFileId: uuid("photo_file_id"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("persons_org_identity_idx").on(t.orgId, t.identityNo),
    ...tenantPolicies("persons"),
  ],
).enableRLS();

/** Links an access user to an operational person within an org. */
export const userPersons = pgTable(
  "user_persons",
  {
    id: primaryId(),
    orgId: orgId(),
    userId: text("user_id").notNull(),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("user_persons_org_user_idx").on(t.orgId, t.userId),
    uniqueIndex("user_persons_org_person_idx").on(t.orgId, t.personId),
    ...tenantPolicies("user_persons"),
  ],
).enableRLS();
