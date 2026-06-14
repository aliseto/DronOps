import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

/**
 * Idempotent e2e/dev seed (privileged admin connection; bypasses RLS). Creates
 * the minimal identity + org graph the AUTH_E2E_BYPASS user ("e2e-user")
 * needs to resolve an active org, person, and domain roles — plus one
 * in-review controlled document so the obligations inbox and Documents
 * register are non-empty for the G8 release-gate story. Fixed UUIDs + ON
 * CONFLICT DO NOTHING make it safe to re-run.
 *
 * Connects directly (not getAdminDb) so it runs under tsx without pulling in
 * the server-only request-path client.
 */

const E2E_USER_ID = "e2e-user"; // matches the AUTH_E2E_BYPASS identity
const ORG = "00000000-0000-0000-e2e0-000000000001";
const PERSON = "00000000-0000-0000-e2e0-000000000002";
const DOC = "00000000-0000-0000-e2e0-000000000003";
const REV = "00000000-0000-0000-e2e0-000000000004";

async function main() {
  const url = process.env.ADMIN_DATABASE_URL;
  if (!url) throw new Error("ADMIN_DATABASE_URL is required to seed");
  const sql = postgres(url, { max: 1, prepare: false });
  const db = drizzle(sql, { schema });

  await db.insert(schema.organizations).values({ id: ORG, name: "Aironov (E2E)", slug: "aironov-e2e", createdBy: E2E_USER_ID }).onConflictDoNothing();

  await db.insert(schema.memberships).values({ orgId: ORG, userId: E2E_USER_ID, email: "e2e@dronops.test", role: "owner", status: "active" }).onConflictDoNothing();

  await db.insert(schema.persons).values({ id: PERSON, orgId: ORG, name: "E2E Operator", email: "e2e@dronops.test" }).onConflictDoNothing();

  await db.insert(schema.userPersons).values({ orgId: ORG, userId: E2E_USER_ID, personId: PERSON }).onConflictDoNothing();

  // QM + AM + ops so the dashboard manager obligations and document approvals surface.
  await db
    .insert(schema.personRoles)
    .values(
      (["quality_manager", "accountable_manager", "ops_manager"] as const).map((role) => ({
        orgId: ORG,
        personId: PERSON,
        role,
        grantedBy: E2E_USER_ID,
      })),
    )
    .onConflictDoNothing();

  // One enabled regulator so safety/missions resolve a single jurisdiction.
  await db.insert(schema.orgJurisdictions).values({ orgId: ORG, jurisdictionKey: "UAE-Federal", enabledBy: E2E_USER_ID }).onConflictDoNothing();

  // A controlled document with an in-review revision → an approval obligation
  // for the QM/AM e2e user, and a non-empty Documents register.
  await db.insert(schema.documents).values({ id: DOC, orgId: ORG, category: "procedure", docNo: "SOP-001", title: "E2E Operations Manual", ownerPersonId: PERSON }).onConflictDoNothing();
  await db.insert(schema.documentRevisions).values({ id: REV, orgId: ORG, documentId: DOC, revNo: 1, status: "in_review", changeSummary: "Initial issue for review." }).onConflictDoNothing();

  await sql.end();
  console.log("e2e seed applied");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
