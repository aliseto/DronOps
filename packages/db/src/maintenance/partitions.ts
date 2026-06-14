import "server-only";
import { sql } from "drizzle-orm";
import type { AppDatabase } from "../client";

/**
 * audit_events is RANGE-partitioned by month on created_at (migration 0004),
 * seeded through 2027-12 with a DEFAULT catch-all. Rows past the last explicit
 * partition land in DEFAULT — which defeats pruning/retention AND traps the
 * month: Postgres refuses to CREATE a partition for a range once DEFAULT holds
 * matching rows. So a scheduled job must create each month's partition BEFORE
 * any row needs it. This module is that job's core, kept pure for testing and
 * runnable via the live SQL harness independent of the Inngest runtime.
 *
 * Bounds are emitted as bare YYYY-MM-01 dates, identical to the migration, and
 * are contiguous with the seeded partitions when the DB session is UTC
 * (Supabase default) — matching how the seeded bounds were cast.
 */

export interface PartitionSpec {
  /** Partition table name, e.g. "audit_events_202608". */
  name: string;
  /** Inclusive lower bound (YYYY-MM-01). */
  from: string;
  /** Exclusive upper bound = first of the next month (YYYY-MM-01). */
  to: string;
}

const ym = (d: Date) =>
  `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
const firstOfMonthIso = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;

/**
 * The monthly partitions that should exist from the current month through
 * `monthsAhead` months into the future (inclusive). Idempotent by construction:
 * callers CREATE ... IF NOT EXISTS, so re-running is a no-op.
 */
export function partitionsToEnsure(now: Date, monthsAhead: number): PartitionSpec[] {
  if (monthsAhead < 0) throw new Error("monthsAhead must be >= 0");
  const specs: PartitionSpec[] = [];
  for (let i = 0; i <= monthsAhead; i++) {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i + 1, 1));
    specs.push({ name: `audit_events_${ym(from)}`, from: firstOfMonthIso(from), to: firstOfMonthIso(to) });
  }
  return specs;
}

const SAFE_NAME = /^audit_events_\d{6}$/;

/**
 * Create any missing monthly audit_events partitions up to `monthsAhead` ahead.
 * Runs as the privileged (admin) connection — partition DDL is an operational
 * act, never a tenant query. Returns the partitions that now exist.
 */
export async function ensureAuditPartitions(
  db: AppDatabase,
  monthsAhead = 3,
  now: Date = new Date(),
): Promise<PartitionSpec[]> {
  const specs = partitionsToEnsure(now, monthsAhead);
  for (const s of specs) {
    // name is internally generated; validate defensively before interpolation.
    if (!SAFE_NAME.test(s.name)) throw new Error(`unsafe partition name: ${s.name}`);
    await db.execute(
      sql.raw(
        `CREATE TABLE IF NOT EXISTS "${s.name}" PARTITION OF audit_events ` +
          `FOR VALUES FROM ('${s.from}') TO ('${s.to}')`,
      ),
    );
  }
  return specs;
}
