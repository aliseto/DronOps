"use server";

import { revalidatePath } from "next/cache";
import type { FindingStatus, TriageDecision } from "@dronops/shared";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getCurrentPersonId } from "@/server/rbac";
import { addCapaAction, transitionFinding, triageFinding, setCoverage, raiseFindingFromGap } from "@/server/compliance";
import type { CoverageStatus } from "@dronops/shared";

async function ctx() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Not authenticated");
  const orgId = await getActiveOrgId(user.id);
  if (!orgId) throw new Error("No active organization");
  return { orgId, userId: user.id };
}

const str = (v: FormDataEntryValue | null) => String(v ?? "").trim() || undefined;
const dt = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s ? new Date(s) : undefined;
};

export async function triageFindingAction(formData: FormData) {
  const c = await ctx();
  const id = String(formData.get("findingId") ?? "");
  const decision = String(formData.get("decision") ?? "") as TriageDecision;
  const reason = String(formData.get("reason") ?? "");
  if (!id || !["accept", "downgrade", "false-positive"].includes(decision)) throw new Error("A triage decision is required");
  await triageFinding(c, id, decision, reason);
  revalidatePath("/compliance");
  revalidatePath(`/compliance/${id}`);
}

export async function transitionFindingAction(formData: FormData) {
  const c = await ctx();
  const id = String(formData.get("findingId") ?? "");
  const to = String(formData.get("to") ?? "") as FindingStatus;
  if (!id || !to) throw new Error("A target status is required");
  // The verifier is the acting person; the DB SoD trigger rejects raiser = verifier.
  const verifierPersonId = (await getCurrentPersonId(c.orgId, c.userId)) ?? undefined;
  await transitionFinding(c, id, to, verifierPersonId);
  revalidatePath("/compliance");
  revalidatePath(`/compliance/${id}`);
}

export async function addCapaActionAction(formData: FormData) {
  const c = await ctx();
  const findingId = String(formData.get("findingId") ?? "");
  const kind = String(formData.get("kind") ?? "corrective") as "containment" | "corrective" | "preventive";
  const description = String(formData.get("description") ?? "");
  if (!findingId || !description.trim()) throw new Error("A description is required");
  await addCapaAction(c, { findingId, kind, description, ownerPersonId: str(formData.get("ownerPersonId")), dueAt: dt(formData.get("dueAt")) });
  revalidatePath(`/compliance/${findingId}`);
}

export async function setCoverageAction(formData: FormData) {
  const c = await ctx();
  const requirementRef = String(formData.get("requirementRef") ?? "");
  const status = String(formData.get("status") ?? "") as CoverageStatus;
  if (!requirementRef || !["covered", "partial", "gap", "n-a"].includes(status)) throw new Error("A coverage status is required");
  const reviewedByPersonId = (await getCurrentPersonId(c.orgId, c.userId)) ?? undefined;
  await setCoverage(c, requirementRef, { status, controllingDocumentId: str(formData.get("controllingDocumentId")), note: str(formData.get("note")), reviewedByPersonId });
  revalidatePath("/compliance/coverage");
}

export async function raiseFindingFromGapAction(formData: FormData) {
  const c = await ctx();
  const requirementRef = String(formData.get("requirementRef") ?? "");
  if (!requirementRef) throw new Error("A requirement is required");
  await raiseFindingFromGap(c, requirementRef);
  revalidatePath("/compliance/coverage");
  revalidatePath("/compliance");
}
