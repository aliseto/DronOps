import "server-only";
import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

export type AppDatabase = PostgresJsDatabase<typeof schema>;
/** A transaction handle — the only thing withTenant hands to callers. */
export type Tx = Parameters<Parameters<AppDatabase["transaction"]>[0]>[0];

// postgres.js connects lazily (first query), so constructing with a placeholder
// when env is absent lets `next build` import server modules without DB secrets;
// a real query fails clearly at runtime if misconfigured.
const PLACEHOLDER = "postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder";

function make(url: string | undefined): AppDatabase {
  // prepare:false is mandatory on Supabase's transaction pooler (reused conns).
  const sql = postgres(url ?? PLACEHOLDER, { prepare: false });
  return drizzle(sql, { schema });
}

let _app: AppDatabase | undefined;
let _admin: AppDatabase | undefined;

/** Request-path client: connects as the restricted app_user role (RLS enforced). */
export function getDb(): AppDatabase {
  if (!_app) _app = make(process.env.DATABASE_URL);
  return _app;
}

/** Privileged client (bypasses RLS): auth/identity, jobs and seed. Never the
 * tenant request path. */
export function getAdminDb(): AppDatabase {
  if (!_admin) _admin = make(process.env.ADMIN_DATABASE_URL);
  return _admin;
}
