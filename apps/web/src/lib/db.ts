import { createSql, createDb, withRlsSession, type RlsClaims, type Database } from "@dom/db";
import type { Sql } from "postgres";

/**
 * Server-only DB access. Two connections:
 *  - app (DATABASE_URL): request path; queries run via withRls() which sets the
 *    Supabase request claims and the `authenticated` role so two-tier RLS applies.
 *  - admin (ADMIN_DATABASE_URL): privileged (bypasses RLS) for jobs/seed only.
 */
let appConn: Sql | undefined;
let adminConn: Sql | undefined;

function app(): Sql {
  return (appConn ??= createSql(process.env.DATABASE_URL!));
}
function admin(): Sql {
  return (adminConn ??= createSql(process.env.ADMIN_DATABASE_URL ?? process.env.DATABASE_URL!));
}

/** Run a function with RLS enforced for the given user. */
export function withRls<T>(claims: RlsClaims, fn: (db: Database) => Promise<T>): Promise<T> {
  return withRlsSession(app(), claims, fn);
}

/** Privileged Drizzle (RLS-bypassing). Use sparingly — jobs/seed/system paths. */
export function adminDb() {
  return createDb(admin());
}
