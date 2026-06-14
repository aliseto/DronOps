import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { rollAuditPartitions } from "@/inngest/functions/roll-audit-partitions";

/** Inngest serve endpoint — registers the job functions with the runtime. */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [rollAuditPartitions],
});
