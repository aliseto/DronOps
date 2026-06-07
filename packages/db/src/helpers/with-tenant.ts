import "server-only";
import { sql } from "drizzle-orm";
import type { AppDatabase, Tx } from "../client";

export interface TenantCtx {
  orgId: string;
  userId: string;
}

/**
 * Runs `fn` inside a transaction with the tenant GUCs set transaction-locally.
 * RLS policies read app.current_org_id; every org-scoped query must go through
 * here. SET LOCAL (set_config third arg = true) reverts at tx end, which is
 * required on Supabase's connection-reusing pooler.
 */
export async function withTenant<T>(
  db: AppDatabase,
  ctx: TenantCtx,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.current_org_id', ${ctx.orgId}, true)`);
    await tx.execute(sql`select set_config('app.current_user_id', ${ctx.userId}, true)`);
    return fn(tx);
  });
}
