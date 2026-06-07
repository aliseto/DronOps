import "server-only";
import { and, eq } from "drizzle-orm";
import { getAdminDb, mutate } from "@dronops/db";
import { files } from "@dronops/db/schema";
import { putObject } from "./storage";

type FileRow = typeof files.$inferSelect;

export interface UploadInput {
  sha256: string;
  bytes: Uint8Array;
  mime: string;
  size: number;
  name?: string;
  grade?: "telemetry" | "cloud" | "manual";
}

/** Upload evidence, content-addressed. Dedupes by (org, sha256); audited insert. */
export async function uploadEvidence(
  ctx: { orgId: string; userId: string },
  input: UploadInput,
): Promise<{ file: FileRow; deduped: boolean }> {
  const db = getAdminDb();
  const [existing] = await db
    .select()
    .from(files)
    .where(and(eq(files.orgId, ctx.orgId), eq(files.sha256, input.sha256)))
    .limit(1);
  if (existing) return { file: existing, deduped: true };

  const storageKey = await putObject(ctx.orgId, input.sha256, input.bytes, input.mime);

  const file = await mutate<FileRow>(
    db,
    ctx,
    (f) => ({
      action: "file.upload",
      entityType: "file",
      entityId: f.id,
      after: { sha256: f.sha256, mime: f.mime, size: f.size },
      amr: "password",
    }),
    async (tx) => {
      const [f] = await tx
        .insert(files)
        .values({
          orgId: ctx.orgId,
          sha256: input.sha256,
          mime: input.mime,
          size: input.size,
          originalName: input.name,
          storageKey,
          grade: input.grade,
          uploadedBy: ctx.userId,
        })
        .returning();
      if (!f) throw new Error("file insert failed");
      return f;
    },
  );
  return { file, deduped: false };
}
