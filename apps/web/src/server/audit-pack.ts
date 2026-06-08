import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getAdminDb, withTenant, type TenantCtx, type Tx } from "@dronops/db";
import {
  auditEvents,
  auditPacks,
  counters,
  documentRevisions,
  documents,
  files,
  findings,
  managementReviews,
  persons,
  signatures,
} from "@dronops/db/schema";
import {
  payloadHash,
  summarizeAuditPack,
  type AuditPackSnapshot,
  type PackCoverageFramework,
  type PackDocumentInput,
  type PackFindingInput,
  type PackReviewInput,
} from "@dronops/shared";
import { requireAnyRole, getCurrentPersonId } from "./rbac";
import { verifyPassword } from "./signing";
import { getCoverageMatrix } from "./compliance";
import { listFindings } from "./compliance";
import { listDocuments } from "./documents";
import { listManagementReviews } from "./management-review";

async function audit(
  tx: Tx,
  ctx: TenantCtx,
  e: { action: string; entityType: string; entityId?: string; before?: unknown; after?: unknown; amr?: string },
) {
  await tx.insert(auditEvents).values({
    orgId: ctx.orgId,
    actorUserId: ctx.userId,
    action: e.action,
    entityType: e.entityType,
    entityId: e.entityId,
    before: e.before ?? null,
    after: e.after ?? null,
    amr: e.amr ?? "password",
  });
}

const isoOrNull = (d: Date | null | undefined) => (d ? d.toISOString() : null);

export interface PackSelection {
  findingIds: string[];
  documentIds: string[];
  reviewIds: string[];
}

const EMPTY_SELECTION: PackSelection = { findingIds: [], documentIds: [], reviewIds: [] };

/** Coalesce the nullable jsonb selection into a fully-populated shape. */
function normalizeSelection(s: unknown): PackSelection {
  const v = (s ?? {}) as Partial<PackSelection>;
  return {
    findingIds: Array.isArray(v.findingIds) ? v.findingIds : [],
    documentIds: Array.isArray(v.documentIds) ? v.documentIds : [],
    reviewIds: Array.isArray(v.reviewIds) ? v.reviewIds : [],
  };
}

/**
 * Resolve a free-selection (frameworks + picked ids) into the structured pack
 * snapshot. Used both to render a DRAFT live and to freeze the snapshot at seal.
 * Each artifact is resolved to its content-addressed integrity anchor (document
 * controlling-revision file SHA-256, finding evidence SHA-256, review signature
 * hash) so the evidence index is verifiable.
 */
export async function assembleAuditPack(
  orgId: string,
  frameworks: string[],
  selection: PackSelection,
  period: { start: Date; end: Date },
  asOf: Date,
): Promise<AuditPackSnapshot> {
  const db = getAdminDb();

  // Coverage rolled up across the chosen frameworks.
  const matrix = await getCoverageMatrix(orgId);
  const fwSet = new Set(frameworks);
  const coverage: PackCoverageFramework[] = matrix.frameworks
    .filter((f) => fwSet.has(f.framework))
    .map((f) => ({ framework: f.framework, total: f.total, covered: f.covered, partial: f.partial, gap: f.gap, pct: f.pct }));

  // Resolve the picked findings (+ evidence file hash), documents (+ controlling
  // revision hash), and reviews (+ signature hash) in dependency order.
  const findingRows = selection.findingIds.length
    ? await db.select().from(findings).where(and(eq(findings.orgId, orgId), inArray(findings.id, selection.findingIds)))
    : [];
  const reviewRows = selection.reviewIds.length
    ? await db.select().from(managementReviews).where(and(eq(managementReviews.orgId, orgId), inArray(managementReviews.id, selection.reviewIds)))
    : [];
  const docRows = selection.documentIds.length
    ? await db.select().from(documents).where(and(eq(documents.orgId, orgId), inArray(documents.id, selection.documentIds)))
    : [];

  // Controlling revision per selected document = the highest rev_no.
  const revByDoc = new Map<string, { revNo: number; status: string; bodyFileId: string | null }>();
  if (docRows.length) {
    const revs = await db
      .select({ documentId: documentRevisions.documentId, revNo: documentRevisions.revNo, status: documentRevisions.status, bodyFileId: documentRevisions.bodyFileId })
      .from(documentRevisions)
      .where(and(eq(documentRevisions.orgId, orgId), inArray(documentRevisions.documentId, selection.documentIds)));
    for (const r of revs) {
      const cur = revByDoc.get(r.documentId);
      if (!cur || r.revNo > cur.revNo) revByDoc.set(r.documentId, { revNo: r.revNo, status: r.status, bodyFileId: r.bodyFileId });
    }
  }

  // One pass to resolve every referenced file's SHA-256.
  const fileIds = [
    ...findingRows.map((f) => f.evidenceFileId),
    ...[...revByDoc.values()].map((r) => r.bodyFileId),
  ].filter((x): x is string => x != null);
  const shaByFile = new Map<string, string>();
  if (fileIds.length) {
    const rows = await db.select({ id: files.id, sha256: files.sha256 }).from(files).where(and(eq(files.orgId, orgId), inArray(files.id, fileIds)));
    for (const r of rows) shaByFile.set(r.id, r.sha256);
  }

  // Signature hashes for the selected reviews.
  const sigIds = reviewRows.map((r) => r.signatureId).filter((x): x is string => x != null);
  const hashBySig = new Map<string, string>();
  if (sigIds.length) {
    const rows = await db.select({ id: signatures.id, payloadHash: signatures.payloadHash }).from(signatures).where(and(eq(signatures.orgId, orgId), inArray(signatures.id, sigIds)));
    for (const r of rows) hashBySig.set(r.id, r.payloadHash);
  }

  const packFindings: PackFindingInput[] = findingRows.map((f) => ({
    id: f.id,
    code: f.code,
    title: f.title,
    level: f.level,
    status: f.status,
    jurisdiction: f.jurisdiction,
    source: f.source,
    dueAt: isoOrNull(f.dueAt),
    evidenceSha256: f.evidenceFileId ? shaByFile.get(f.evidenceFileId) ?? null : null,
  }));
  const packDocuments: PackDocumentInput[] = docRows.map((d) => {
    const rev = revByDoc.get(d.id);
    return {
      id: d.id,
      docNo: d.docNo,
      title: d.title,
      category: d.category,
      status: rev?.status ?? "draft",
      revNo: rev?.revNo ?? null,
      bodySha256: rev?.bodyFileId ? shaByFile.get(rev.bodyFileId) ?? null : null,
    };
  });
  const packReviews: PackReviewInput[] = reviewRows.map((r) => ({
    id: r.id,
    code: r.code,
    title: r.title,
    periodStart: r.periodStart.toISOString(),
    periodEnd: r.periodEnd.toISOString(),
    status: r.status,
    signedAt: isoOrNull(r.signedAt),
    signatureHash: r.signatureId ? hashBySig.get(r.signatureId) ?? null : null,
  }));

  return summarizeAuditPack({
    frameworks,
    periodStart: period.start.toISOString(),
    periodEnd: period.end.toISOString(),
    sealedAt: asOf.toISOString(),
    findings: packFindings,
    documents: packDocuments,
    reviews: packReviews,
    coverage,
  });
}

export interface AuditPackListItem {
  id: string;
  code: string;
  title: string | null;
  periodStart: string;
  periodEnd: string;
  status: string;
  frameworks: string[];
  sealedAt: string | null;
}

export async function listAuditPacks(orgId: string): Promise<AuditPackListItem[]> {
  const rows = await getAdminDb().select().from(auditPacks).where(eq(auditPacks.orgId, orgId)).orderBy(desc(auditPacks.createdAt));
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    title: r.title,
    periodStart: r.periodStart.toISOString(),
    periodEnd: r.periodEnd.toISOString(),
    status: r.status,
    frameworks: (r.frameworks as string[] | null) ?? [],
    sealedAt: isoOrNull(r.sealedAt),
  }));
}

export interface PackCandidates {
  frameworks: { framework: string; jurisdiction: string }[];
  findings: { id: string; code: string; title: string; level: string; status: string; jurisdiction: string | null }[];
  documents: { id: string; docNo: string; title: string; category: string }[];
  reviews: { id: string; code: string; title: string | null; periodStart: string; periodEnd: string; status: string }[];
}

/** Everything the builder can pick from (drafts only need this). */
export async function getPackCandidates(orgId: string): Promise<PackCandidates> {
  const [matrix, fds, docs, revs] = await Promise.all([
    getCoverageMatrix(orgId),
    listFindings(orgId),
    listDocuments(orgId),
    listManagementReviews(orgId),
  ]);
  return {
    frameworks: matrix.frameworks.map((f) => ({ framework: f.framework, jurisdiction: f.jurisdiction })),
    findings: fds.map((f) => ({ id: f.id, code: f.code, title: f.title, level: f.level, status: f.status, jurisdiction: f.jurisdiction })),
    documents: docs.map((d) => ({ id: d.id, docNo: d.docNo, title: d.title, category: d.category })),
    reviews: revs.map((r) => ({ id: r.id, code: r.code, title: r.title, periodStart: r.periodStart, periodEnd: r.periodEnd, status: r.status })),
  };
}

export interface AuditPackDetail {
  id: string;
  code: string;
  title: string | null;
  periodStart: string;
  periodEnd: string;
  status: string;
  frameworks: string[];
  selection: PackSelection;
  scopeNotes: string | null;
  /** Frozen (sealed) or live (draft) snapshot. */
  snapshot: AuditPackSnapshot;
  sealedBy: string | null;
  sealedAt: string | null;
  signature: { signedAtUtc: string; payloadHash: string; method: string } | null;
}

export async function getAuditPackDetail(orgId: string, id: string): Promise<AuditPackDetail | null> {
  const db = getAdminDb();
  const [r] = await db.select().from(auditPacks).where(and(eq(auditPacks.orgId, orgId), eq(auditPacks.id, id))).limit(1);
  if (!r) return null;

  const frameworks = (r.frameworks as string[] | null) ?? [];
  const selection = normalizeSelection(r.selection);

  const snapshot = r.status === "sealed" && r.contentSnapshot
    ? (r.contentSnapshot as AuditPackSnapshot)
    : await assembleAuditPack(orgId, frameworks, selection, { start: r.periodStart, end: r.periodEnd }, new Date());

  let sealedBy: string | null = null;
  let signature: AuditPackDetail["signature"] = null;
  if (r.sealedByPersonId) {
    const [p] = await db.select({ name: persons.name }).from(persons).where(eq(persons.id, r.sealedByPersonId)).limit(1);
    sealedBy = p?.name ?? null;
  }
  if (r.signatureId) {
    const [s] = await db.select().from(signatures).where(eq(signatures.id, r.signatureId)).limit(1);
    if (s) signature = { signedAtUtc: s.signedAt.toISOString(), payloadHash: s.payloadHash, method: s.method };
  }

  return {
    id: r.id,
    code: r.code,
    title: r.title,
    periodStart: r.periodStart.toISOString(),
    periodEnd: r.periodEnd.toISOString(),
    status: r.status,
    frameworks,
    selection,
    scopeNotes: r.scopeNotes,
    snapshot,
    sealedBy,
    sealedAt: isoOrNull(r.sealedAt),
    signature,
  };
}

export async function createAuditPack(
  ctx: TenantCtx,
  input: { periodStart: Date; periodEnd: Date; title?: string },
): Promise<string> {
  if (input.periodEnd < input.periodStart) throw new Error("Period end must be after the start");
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [c] = await tx
      .insert(counters)
      .values({ orgId: ctx.orgId, key: "audit_pack", value: 1 })
      .onConflictDoUpdate({ target: [counters.orgId, counters.key], set: { value: sql`${counters.value} + 1`, updatedAt: new Date() } })
      .returning({ value: counters.value });
    const code = `AP-${String(c!.value).padStart(3, "0")}`;
    const [r] = await tx
      .insert(auditPacks)
      .values({ orgId: ctx.orgId, code, title: input.title, periodStart: input.periodStart, periodEnd: input.periodEnd, status: "draft", selection: EMPTY_SELECTION, frameworks: [] })
      .returning({ id: auditPacks.id });
    await audit(tx, ctx, { action: "audit_pack.create", entityType: "audit_pack", entityId: r!.id, after: { code } });
    return r!.id;
  });
}

/** Edit the free-selection of a DRAFT pack (sealed is immutable). */
export async function updateAuditPack(
  ctx: TenantCtx,
  id: string,
  patch: { title?: string; scopeNotes?: string; frameworks?: string[]; selection?: PackSelection },
) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [r] = await tx.select().from(auditPacks).where(and(eq(auditPacks.orgId, ctx.orgId), eq(auditPacks.id, id))).limit(1);
    if (!r) throw new Error("audit pack not found");
    if (r.status === "sealed") throw new Error("a sealed audit pack is immutable");
    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (patch.title !== undefined) set.title = patch.title || null;
    if (patch.scopeNotes !== undefined) set.scopeNotes = patch.scopeNotes || null;
    if (patch.frameworks !== undefined) set.frameworks = patch.frameworks;
    if (patch.selection !== undefined) set.selection = normalizeSelection(patch.selection);
    await tx.update(auditPacks).set(set).where(eq(auditPacks.id, id));
    await audit(tx, ctx, { action: "audit_pack.update", entityType: "audit_pack", entityId: id });
  });
}

export interface SealProof {
  method: "password" | "passkey";
  password?: string;
  credentialId?: string;
}

/**
 * Seal the pack (mirrors signManagementReview): role-gate (quality / accountable
 * manager) → re-auth → freeze the resolved snapshot → record a signature BOUND
 * to this pack whose payloadHash anchors the bundle → assert the binding →
 * status `sealed` (immutable thereafter). Atomic + audited.
 */
export async function sealAuditPack(ctx: TenantCtx, input: { id: string; meaning: string; proof: SealProof }) {
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
    const [r] = await tx.select().from(auditPacks).where(and(eq(auditPacks.orgId, ctx.orgId), eq(auditPacks.id, input.id))).limit(1);
    if (!r) throw new Error("audit pack not found");
    if (r.status !== "draft") throw new Error("only a draft pack can be sealed");

    const frameworks = (r.frameworks as string[] | null) ?? [];
    const selection = normalizeSelection(r.selection);
    if (frameworks.length === 0) throw new Error("Select at least one framework before sealing");

    const sealedAt = new Date();
    const snapshot = await assembleAuditPack(ctx.orgId, frameworks, selection, { start: r.periodStart, end: r.periodEnd }, sealedAt);
    const hash = await payloadHash({ code: r.code, title: r.title, scopeNotes: r.scopeNotes, snapshot });

    const [sig] = await tx
      .insert(signatures)
      .values({ orgId: ctx.orgId, signerPersonId, meaning: input.meaning, entityType: "audit_pack", entityId: input.id, payloadHash: hash, method: input.proof.method, credentialId: input.proof.credentialId })
      .returning();
    if (!sig) throw new Error("signature insert failed");
    if (sig.entityType !== "audit_pack" || sig.entityId !== input.id) throw new Error("signature is not bound to this pack");

    await tx
      .update(auditPacks)
      .set({ status: "sealed", contentSnapshot: snapshot, sealedByPersonId: signerPersonId, signatureId: sig.id, sealedAt, updatedAt: sealedAt })
      .where(eq(auditPacks.id, input.id));
    await audit(tx, ctx, { action: "audit_pack.seal", entityType: "audit_pack", entityId: input.id, after: { payloadHash: hash }, amr });

    const [signer] = await tx.select({ name: persons.name }).from(persons).where(eq(persons.id, signerPersonId)).limit(1);
    return { signerName: signer?.name ?? "Signer", signedAtUtc: sealedAt.toISOString(), payloadHash: hash, method: input.proof.method };
  });
}
