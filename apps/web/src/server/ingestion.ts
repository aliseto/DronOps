import { createHash } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { schema } from "@dom/db";
import { parseDjiFlightRecord } from "@dom/parsers";
import { withRls } from "@/lib/db";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { claimsOf, type ActiveContext } from "./context";

export function listFlightLogs(ctx: ActiveContext) {
  return withRls(claimsOf(ctx), (db) =>
    db.select().from(schema.flightLogs).orderBy(desc(schema.flightLogs.createdAt)),
  );
}

export type FlightLogRow = Awaited<ReturnType<typeof listFlightLogs>>[number];

/** Upload a DJI log to the org-scoped `logs` bucket, record it, and parse. */
export async function importDjiLog(ctx: ActiveContext, _fileName: string, bytes: Uint8Array): Promise<string> {
  const admin = createSupabaseAdminClient();
  const hash = createHash("sha256").update(bytes).digest("hex");
  const path = `${ctx.orgId}/${hash}.txt`;

  const up = await admin.storage
    .from("logs")
    .upload(path, bytes, { upsert: true, contentType: "application/octet-stream" });
  if (up.error) throw new Error(`Upload failed: ${up.error.message}`);

  const [row] = await withRls(claimsOf(ctx), (db) =>
    db
      .insert(schema.flightLogs)
      .values({
        orgId: ctx.orgId,
        sourceFormat: "dji",
        storagePath: path,
        sizeBytes: bytes.byteLength,
        parseStatus: "pending",
      })
      .returning(),
  );
  await parseLog(ctx, row!.id);
  return row!.id;
}

/** Detect + (when a DJI key/decryptor is wired) decode a stored log. */
export async function parseLog(ctx: ActiveContext, id: string): Promise<void> {
  const [log] = await withRls(claimsOf(ctx), (db) =>
    db
      .select()
      .from(schema.flightLogs)
      .where(and(eq(schema.flightLogs.id, id), eq(schema.flightLogs.orgId, ctx.orgId))),
  );
  if (!log?.storagePath) return;

  const admin = createSupabaseAdminClient();
  const dl = await admin.storage.from("logs").download(log.storagePath);
  if (dl.error || !dl.data) {
    await fail(ctx, id, `Download failed: ${dl.error?.message ?? "no data"}`);
    return;
  }
  const bytes = new Uint8Array(await dl.data.arrayBuffer());

  // The DJI decryptor (keychain via the Open API key) is injected in the M4
  // Edge job; without it parse reports needs_key and the log waits in the tray.
  const result = await parseDjiFlightRecord(bytes);

  if (result.status === "parsed" && result.flight) {
    await withRls(claimsOf(ctx), (db) =>
      db
        .update(schema.flightLogs)
        .set({ parseStatus: "parsed", parseError: null })
        .where(and(eq(schema.flightLogs.id, id), eq(schema.flightLogs.orgId, ctx.orgId))),
    );
    // (future) create a flights row from result.flight and cascade to hours/currency/duty
  } else {
    await fail(ctx, id, result.error ?? result.status);
  }
}

async function fail(ctx: ActiveContext, id: string, reason: string): Promise<void> {
  await withRls(claimsOf(ctx), (db) =>
    db
      .update(schema.flightLogs)
      .set({ parseStatus: "failed", parseError: reason })
      .where(and(eq(schema.flightLogs.id, id), eq(schema.flightLogs.orgId, ctx.orgId))),
  );
  // dead-letter: system_events has no authenticated INSERT policy → service role
  const admin = createSupabaseAdminClient();
  await admin
    .from("system_events")
    .insert({ org_id: ctx.orgId, source: "parser", severity: "error", message: reason, context: { flightLogId: id } });
}
