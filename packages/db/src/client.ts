import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

export type Database = ReturnType<typeof createDb>;

/** A raw postgres.js connection. Reuse one per process. */
export function createSql(connectionString: string, opts?: postgres.Options<Record<string, never>>) {
  return postgres(connectionString, { prepare: false, ...opts });
}

/** Drizzle bound to a connection (or a transaction). */
export function createDb(sql: postgres.Sql) {
  return drizzle(sql, { schema });
}

export interface RlsClaims {
  /** auth.uid() reads this. */
  sub: string;
  /** auth.email() reads this (strict invite email-match). */
  email: string;
  role?: string;
}

/**
 * Run `fn` inside a transaction with the Supabase-compatible request claims set,
 * as the `authenticated` role, so the two-tier RLS policies (which read
 * auth.uid()/auth.email()) enforce isolation. The connecting role must have the
 * `authenticated` role granted so `set local role` succeeds.
 */
export async function withRlsSession<T>(
  sql: postgres.Sql,
  claims: RlsClaims,
  fn: (db: ReturnType<typeof createDb>) => Promise<T>,
): Promise<T> {
  return sql.begin(async (tx) => {
    await tx`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true)`;
    await tx`set local role authenticated`;
    return fn(createDb(tx as unknown as postgres.Sql));
  }) as Promise<T>;
}
