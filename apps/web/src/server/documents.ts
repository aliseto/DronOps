import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getAdminDb, withTenant, type TenantCtx, type Tx } from "@dronops/db";
import {
  auditEvents,
  counters,
  documents,
  documentRevisions,
  documentRequirements,
  signatures,
} from "@dronops/db/schema";
import {
  CATEGORY_PREFIX,
  categorySkipsApproval,
  payloadHash,
  type DocumentCategory,
} from "@dronops/shared";
import { getCurrentPersonId, requireAnyRole } from "./rbac";
import { verifyPassword } from "./signing";

type DocumentRow = typeof documents.$inferSelect;
type RevisionRow = typeof documentRevisions.$inferSelect;

async function audit(
  tx: Tx,
  ctx: TenantCtx,
  e: {
    action: string;
    entityType: string;
    entityId?: string;
    before?: unknown;
    after?: unknown;
    amr?: "password" | "webauthn" | "system";
  },
) {
  await tx.insert(auditEvents).values({
    orgId: ctx.orgId,
    actorUserId: ctx.userId,
    action: e.action,
    entityType: e.entityType,
    entityId: e.entityId,
    before: e.before ?? null,
    after: e.after ?? null,
    amr: e.amr ?? "system",
  });
}

/** Atomic per-category counter → next doc number (MAN-001, SOP-002, …). */
async function nextDocNo(tx: Tx, orgId: string, category: DocumentCategory): Promise<string> {
  const [c] = await tx
    .insert(counters)
    .values({ orgId, key: `doc:${category}`, value: 1 })
    .onConflictDoUpdate({
      target: [counters.orgId, counters.key],
      set: { value: sql`${counters.value} + 1`, updatedAt: new Date() },
    })
    .returning({ value: counters.value });
  return `${CATEGORY_PREFIX[category]}-${String(c!.value).padStart(3, "0")}`;
}

export interface CreateDocumentInput {
  category: DocumentCategory;
  title: string;
  customNumber?: string;
  ownerPersonId?: string;
  jurisdictionTags?: string[];
  reviewDueAt?: Date;
}

/** Create a document + its first revision. External docs skip approval: the
 * first revision is effective immediately and review-due is tracked. */
export async function createDocument(ctx: TenantCtx, input: CreateDocumentInput) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const docNo = input.customNumber?.trim() || (await nextDocNo(tx, ctx.orgId, input.category));
    const external = categorySkipsApproval(input.category);

    const [doc] = await tx
      .insert(documents)
      .values({
        orgId: ctx.orgId,
        category: input.category,
        docNo,
        title: input.title,
        ownerPersonId: input.ownerPersonId,
        jurisdictionTags: input.jurisdictionTags,
        reviewDueAt: input.reviewDueAt,
      })
      .returning();
    if (!doc) throw new Error("document insert failed");

    const [rev] = await tx
      .insert(documentRevisions)
      .values({
        orgId: ctx.orgId,
        documentId: doc.id,
        revNo: 1,
        status: external ? "approved" : "draft",
        effectiveAt: external ? new Date() : null,
      })
      .returning();
    if (!rev) throw new Error("revision insert failed");

    if (external) {
      await tx
        .update(documents)
        .set({ currentRevisionId: rev.id, updatedAt: new Date() })
        .where(eq(documents.id, doc.id));
    }

    await audit(tx, ctx, {
      action: "document.create",
      entityType: "document",
      entityId: doc.id,
      after: { docNo, category: input.category, title: input.title },
      amr: "password",
    });
    await audit(tx, ctx, {
      action: "document_revision.create",
      entityType: "document_revision",
      entityId: rev.id,
      after: { revNo: 1, status: rev.status },
    });
    return { document: doc, revision: rev };
  });
}

/** Start a new draft revision (rev_no = max + 1). */
export async function createRevision(ctx: TenantCtx, documentId: string): Promise<RevisionRow> {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const maxRows = await tx
      .select({ maxRev: sql<number>`coalesce(max(${documentRevisions.revNo}), 0)` })
      .from(documentRevisions)
      .where(and(eq(documentRevisions.orgId, ctx.orgId), eq(documentRevisions.documentId, documentId)));
    const next = Number(maxRows[0]?.maxRev ?? 0) + 1;
    const [rev] = await tx
      .insert(documentRevisions)
      .values({ orgId: ctx.orgId, documentId, revNo: next, status: "draft" })
      .returning();
    if (!rev) throw new Error("revision insert failed");
    await audit(tx, ctx, {
      action: "document_revision.create",
      entityType: "document_revision",
      entityId: rev.id,
      after: { revNo: next },
    });
    return rev;
  });
}

export async function updateDraftRevision(
  ctx: TenantCtx,
  revisionId: string,
  patch: { changeSummary?: string; bodyRich?: string; bodyFileId?: string },
) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [rev] = await tx
      .select()
      .from(documentRevisions)
      .where(and(eq(documentRevisions.orgId, ctx.orgId), eq(documentRevisions.id, revisionId)))
      .limit(1);
    if (!rev) throw new Error("revision not found");
    if (rev.status !== "draft" && rev.status !== "in_review") {
      throw new Error("only draft or in-review revisions can be edited");
    }
    await tx
      .update(documentRevisions)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(documentRevisions.id, revisionId));
    await audit(tx, ctx, {
      action: "document_revision.update",
      entityType: "document_revision",
      entityId: revisionId,
      after: patch,
    });
  });
}

export async function submitForReview(ctx: TenantCtx, revisionId: string) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [rev] = await tx
      .select()
      .from(documentRevisions)
      .where(and(eq(documentRevisions.orgId, ctx.orgId), eq(documentRevisions.id, revisionId)))
      .limit(1);
    if (!rev) throw new Error("revision not found");
    if (rev.status !== "draft") throw new Error("only draft revisions can be submitted");
    await tx
      .update(documentRevisions)
      .set({ status: "in_review", updatedAt: new Date() })
      .where(eq(documentRevisions.id, revisionId));
    await audit(tx, ctx, {
      action: "document_revision.submit",
      entityType: "document_revision",
      entityId: revisionId,
      before: { status: "draft" },
      after: { status: "in_review" },
    });
  });
}

export interface ApproveProof {
  method: "password" | "passkey";
  password?: string;
  /** Pre-verified passkey credential id (caller ran verifyFreshPasskey). */
  credentialId?: string;
}

/**
 * Single-transaction approval (the tamper-evident core, D-01):
 * requireRole → verify re-auth → record a signature BOUND to this revision
 * (entity_type + entity_id) → assert that binding → approve + effective →
 * obsolete the previous approved revision → update current_revision_id → audit.
 * A signature that merely exists is not sufficient; the binding is the check.
 */
export async function approveRevision(
  ctx: TenantCtx,
  input: { revisionId: string; meaning: string; proof: ApproveProof },
): Promise<RevisionRow> {
  await requireAnyRole(ctx.orgId, ctx.userId, ["quality_manager", "accountable_manager"]);
  const signerPersonId = await getCurrentPersonId(ctx.orgId, ctx.userId);
  if (!signerPersonId) throw new Error("No person record for the signer");

  if (input.proof.method === "password") {
    if (!input.proof.password || !(await verifyPassword(ctx.userId, input.proof.password))) {
      throw new Error("Password re-authentication failed");
    }
  } else if (!input.proof.credentialId) {
    throw new Error("Passkey re-authentication required");
  }
  const amr = input.proof.method === "passkey" ? "webauthn" : "password";

  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [rev] = await tx
      .select()
      .from(documentRevisions)
      .where(and(eq(documentRevisions.orgId, ctx.orgId), eq(documentRevisions.id, input.revisionId)))
      .limit(1);
    if (!rev) throw new Error("revision not found");
    if (rev.status !== "in_review") throw new Error("only in-review revisions can be approved");

    const hash = await payloadHash({
      documentId: rev.documentId,
      revNo: rev.revNo,
      bodyFileId: rev.bodyFileId,
      bodyRich: rev.bodyRich,
    });

    const [sig] = await tx
      .insert(signatures)
      .values({
        orgId: ctx.orgId,
        signerPersonId,
        meaning: input.meaning,
        entityType: "document_revision",
        entityId: input.revisionId,
        payloadHash: hash,
        method: input.proof.method,
        credentialId: input.proof.credentialId,
      })
      .returning();
    if (!sig) throw new Error("signature insert failed");
    // tamper-evident binding: the signature must reference THIS revision.
    if (sig.entityType !== "document_revision" || sig.entityId !== input.revisionId) {
      throw new Error("signature is not bound to this revision");
    }

    await tx
      .update(documentRevisions)
      .set({
        status: "approved",
        effectiveAt: new Date(),
        approvedByPersonId: signerPersonId,
        signatureId: sig.id,
        updatedAt: new Date(),
      })
      .where(eq(documentRevisions.id, input.revisionId));

    // obsolete the previous approved revision of the same document
    const [prev] = await tx
      .select()
      .from(documentRevisions)
      .where(
        and(
          eq(documentRevisions.orgId, ctx.orgId),
          eq(documentRevisions.documentId, rev.documentId),
          eq(documentRevisions.status, "approved"),
        ),
      )
      .limit(1);
    if (prev && prev.id !== input.revisionId) {
      await tx
        .update(documentRevisions)
        .set({
          status: "obsolete",
          supersededByRevisionId: input.revisionId,
          supersededAt: new Date(),
        })
        .where(eq(documentRevisions.id, prev.id));
      await audit(tx, ctx, {
        action: "document_revision.obsolete",
        entityType: "document_revision",
        entityId: prev.id,
        before: { status: "approved" },
        after: { status: "obsolete", supersededBy: input.revisionId },
        amr,
      });
    }

    await tx
      .update(documents)
      .set({ currentRevisionId: input.revisionId, updatedAt: new Date() })
      .where(eq(documents.id, rev.documentId));

    await audit(tx, ctx, {
      action: "document_revision.approve",
      entityType: "document_revision",
      entityId: input.revisionId,
      before: { status: "in_review" },
      after: { status: "approved", signatureId: sig.id },
      amr,
    });

    const [updated] = await tx
      .select()
      .from(documentRevisions)
      .where(eq(documentRevisions.id, input.revisionId))
      .limit(1);
    return updated!;
  });
}

// ----------------------------------------------------------- requirement links
export async function linkRequirement(ctx: TenantCtx, documentId: string, requirementRef: string) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [existing] = await tx
      .select()
      .from(documentRequirements)
      .where(
        and(
          eq(documentRequirements.orgId, ctx.orgId),
          eq(documentRequirements.documentId, documentId),
          eq(documentRequirements.requirementRef, requirementRef),
        ),
      )
      .limit(1);
    if (existing && !existing.removedAt) return; // already active
    if (existing) {
      await tx
        .update(documentRequirements)
        .set({ removedAt: null, updatedAt: new Date() })
        .where(eq(documentRequirements.id, existing.id));
    } else {
      await tx
        .insert(documentRequirements)
        .values({ orgId: ctx.orgId, documentId, requirementRef });
    }
    await audit(tx, ctx, {
      action: "document_requirement.link",
      entityType: "document",
      entityId: documentId,
      after: { requirementRef },
    });
  });
}

export async function unlinkRequirement(ctx: TenantCtx, documentId: string, requirementRef: string) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    await tx
      .update(documentRequirements)
      .set({ removedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(documentRequirements.orgId, ctx.orgId),
          eq(documentRequirements.documentId, documentId),
          eq(documentRequirements.requirementRef, requirementRef),
        ),
      );
    await audit(tx, ctx, {
      action: "document_requirement.unlink",
      entityType: "document",
      entityId: documentId,
      after: { requirementRef },
    });
  });
}

// ------------------------------------------------------------------- queries
export interface DocumentListItem {
  id: string;
  docNo: string;
  category: string;
  title: string;
  currentStatus: RevisionRow["status"] | null;
  reviewDueAt: Date | null;
  updatedAt: Date;
}

export async function listDocuments(orgId: string): Promise<DocumentListItem[]> {
  const rows = await getAdminDb()
    .select({
      id: documents.id,
      docNo: documents.docNo,
      category: documents.category,
      title: documents.title,
      reviewDueAt: documents.reviewDueAt,
      updatedAt: documents.updatedAt,
      currentStatus: documentRevisions.status,
    })
    .from(documents)
    .leftJoin(documentRevisions, eq(documents.currentRevisionId, documentRevisions.id))
    .where(eq(documents.orgId, orgId));
  return rows as DocumentListItem[];
}

export async function getDocumentWithRevisions(orgId: string, documentId: string) {
  const db = getAdminDb();
  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.orgId, orgId), eq(documents.id, documentId)))
    .limit(1);
  if (!doc) return null;
  const revisions = await db
    .select()
    .from(documentRevisions)
    .where(and(eq(documentRevisions.orgId, orgId), eq(documentRevisions.documentId, documentId)))
    .orderBy(documentRevisions.revNo);
  return { document: doc as DocumentRow, revisions };
}
