import { ensureAuditPartitions, getAdminDb } from "@dronops/db";
import { inngest } from "../client";

/**
 * Monthly audit_events partition roll-forward (the first real Inngest job).
 * Runs on the 1st at 03:00 UTC and keeps three months of partitions ahead of
 * "now", so rows never reach the DEFAULT catch-all (which would defeat pruning
 * and trap the month). Idempotent: CREATE ... IF NOT EXISTS. Runs as the
 * privileged admin connection — partition DDL is operational, not tenant-scoped.
 *
 * Also reachable on demand via the "audit/partitions.ensure" event for
 * backfills without waiting for the cron.
 */
export const rollAuditPartitions = inngest.createFunction(
  { id: "roll-audit-partitions", name: "Roll audit_events partitions forward" },
  [{ cron: "0 3 1 * *" }, { event: "audit/partitions.ensure" }],
  async ({ step }) => {
    const ensured = await step.run("ensure-partitions", async () => {
      const specs = await ensureAuditPartitions(getAdminDb(), 3);
      return specs.map((s) => s.name);
    });
    return { ensured };
  },
);
