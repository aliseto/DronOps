"use server";

import { revalidatePath } from "next/cache";
import { isDocumentCategory, sha256Hex, type DocumentCategory } from "@dronops/shared";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import {
  approveRevision,
  createDocument,
  createRevision,
  linkRequirement,
  replaceExternalDocument,
  submitForReview,
  unlinkRequirement,
  updateDraftRevision,
  type ApproveProof,
} from "@/server/documents";
import { uploadEvidence } from "@/server/files";
import { logFileAccess } from "@/server/files-access";
import { acknowledgeDistribution, distributeRevision } from "@/server/distributions";

async function ctx() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Not authenticated");
  const orgId = await getActiveOrgId(user.id);
  if (!orgId) throw new Error("No active organization");
  return { orgId, userId: user.id };
}

export async function createDocumentAction(formData: FormData) {
  const c = await ctx();
  const category = String(formData.get("category") ?? "");
  if (!isDocumentCategory(category)) throw new Error("Invalid category");
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Title is required");
  const customNumber = String(formData.get("customNumber") ?? "").trim() || undefined;
  const reviewDue = String(formData.get("reviewDueAt") ?? "").trim();
  await createDocument(c, {
    category: category as DocumentCategory,
    title,
    customNumber,
    reviewDueAt: reviewDue ? new Date(reviewDue) : undefined,
  });
  revalidatePath("/documents");
}

export async function submitForReviewAction(revisionId: string) {
  await submitForReview(await ctx(), revisionId);
  revalidatePath("/documents");
}

export async function newRevisionAction(documentId: string) {
  await createRevision(await ctx(), documentId);
  revalidatePath("/documents");
}

export async function saveDraftAction(
  revisionId: string,
  patch: { changeSummary?: string; bodyRich?: string },
) {
  await updateDraftRevision(await ctx(), revisionId, patch);
  revalidatePath("/documents");
}

export async function linkRequirementAction(documentId: string, requirementRef: string) {
  await linkRequirement(await ctx(), documentId, requirementRef);
  revalidatePath("/documents");
}

export async function unlinkRequirementAction(documentId: string, requirementRef: string) {
  await unlinkRequirement(await ctx(), documentId, requirementRef);
  revalidatePath("/documents");
}

/** Called by the SignatureCeremony. Role-gated + re-auth verified server-side. */
export async function approveRevisionAction(
  revisionId: string,
  meaning: string,
  proof: ApproveProof,
) {
  const result = await approveRevision(await ctx(), { revisionId, meaning, proof });
  revalidatePath("/documents");
  return {
    signerName: result.signerName,
    signedAtUtc: result.revision.effectiveAt?.toISOString() ?? new Date().toISOString(),
    payloadHash: result.signature.payloadHash,
    method: proof.method,
  };
}

export async function logDownloadAction(fileId: string, documentId: string) {
  await logFileAccess(await ctx(), fileId, documentId);
}

export async function distributeAction(revisionId: string, formData: FormData) {
  const c = await ctx();
  const audienceType = String(formData.get("audienceType") ?? "role") === "person" ? "person" : "role";
  const audienceRef = String(formData.get("audienceRef") ?? "").trim();
  if (!audienceRef) throw new Error("Select an audience");
  const ackRequired = formData.get("ackRequired") != null;
  const due = String(formData.get("dueAt") ?? "").trim();
  await distributeRevision(c, revisionId, {
    audienceType,
    audienceRef,
    ackRequired,
    dueAt: due ? new Date(due) : undefined,
  });
  revalidatePath("/documents");
}

export async function acknowledgeAction(distributionId: string) {
  await acknowledgeDistribution(await ctx(), distributionId);
  revalidatePath("/documents");
  revalidatePath("/dashboard");
}

/** External docs: upload a new file + set a new review date (old retained). */
export async function replaceExternalAction(documentId: string, formData: FormData) {
  const c = await ctx();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("A file is required");
  const reviewDue = String(formData.get("reviewDueAt") ?? "").trim();

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sha256 = await sha256Hex(bytes);
  const { file: stored } = await uploadEvidence(c, {
    sha256,
    bytes,
    mime: file.type || "application/octet-stream",
    size: file.size,
    name: file.name,
    grade: "manual",
  });
  await replaceExternalDocument(c, documentId, {
    fileId: stored.id,
    reviewDueAt: reviewDue ? new Date(reviewDue) : undefined,
  });
  revalidatePath("/documents");
}
