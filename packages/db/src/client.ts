import { drizzle } from "drizzle-orm/postgres-js";
import { sql as sqlTag } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "./schema/index";

export type Database = ReturnType<typeof createDb>;

/** A raw postgres.js connection. Reuse one per process. */
export function createSql(connectionString: string, opts?: postgres.Options<Record<string, never>>) {
  return postgres(connectionString, { prepare: false, ...opts });
}

/** Drizzle bound to a connection. */
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
 * auth.uid()/auth.email()) enforce isolation. Uses Drizzle's transaction API so
 * the tx is a proper Drizzle handle. The connecting role must be able to
 * `set local role authenticated`.
 */
export async function withRlsSession<T>(
  sql: postgres.Sql,
  claims: RlsClaims,
  fn: (db: Database) => Promise<T>,
): Promise<T> {
  const db = createDb(sql);
  return db.transaction(async (tx) => {
    await tx.execute(
      sqlTag`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true)`,
    );
    await tx.execute(sqlTag`set local role authenticated`);
    return fn(tx as unknown as Database);
  });
}
