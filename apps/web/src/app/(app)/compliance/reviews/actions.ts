"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import {
  createManagementReview,
  updateManagementReview,
  signManagementReview,
  type SignProof,
} from "@/server/management-review";

async function ctx() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Not authenticated");
  const orgId = await getActiveOrgId(user.id);
  if (!orgId) throw new Error("No active organization");
  return { orgId, userId: user.id };
}

export async function createReviewAction(formData: FormData) {
  const c = await ctx();
  const title = String(formData.get("title") ?? "").trim() || undefined;
  const periodStart = String(formData.get("periodStart") ?? "").trim();
  const periodEnd = String(formData.get("periodEnd") ?? "").trim();
  if (!periodStart || !periodEnd) throw new Error("A review period is required");
  const id = await createManagementReview(c, { title, periodStart: new Date(periodStart), periodEnd: new Date(periodEnd) });
  revalidatePath("/compliance/reviews");
  return id;
}

export async function updateReviewAction(formData: FormData) {
  const c = await ctx();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("A review is required");
  const field = (k: string) => {
    const v = formData.get(k);
    return v == null ? undefined : String(v);
  };
  await updateManagementReview(c, id, {
    priorActions: field("priorActions"),
    customerFeedback: field("customerFeedback"),
    riskEffectiveness: field("riskEffectiveness"),
    improvements: field("improvements"),
    resourceNotes: field("resourceNotes"),
    outputs: field("outputs"),
  });
  revalidatePath(`/compliance/reviews/${id}`);
}

/** Called by the SignatureCeremony. Accountable-manager role + re-auth verified server-side. */
export async function signReviewAction(id: string, meaning: string, proof: SignProof) {
  const c = await ctx();
  const result = await signManagementReview(c, { id, meaning, proof });
  revalidatePath(`/compliance/reviews/${id}`);
  revalidatePath("/compliance/reviews");
  return result;
}
