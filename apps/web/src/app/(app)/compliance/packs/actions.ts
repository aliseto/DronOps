"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import {
  createAuditPack,
  updateAuditPack,
  sealAuditPack,
  type PackSelection,
  type SealProof,
} from "@/server/audit-pack";

async function ctx() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Not authenticated");
  const orgId = await getActiveOrgId(user.id);
  if (!orgId) throw new Error("No active organization");
  return { orgId, userId: user.id };
}

export async function createPackAction(formData: FormData) {
  const c = await ctx();
  const title = String(formData.get("title") ?? "").trim() || undefined;
  const periodStart = String(formData.get("periodStart") ?? "").trim();
  const periodEnd = String(formData.get("periodEnd") ?? "").trim();
  if (!periodStart || !periodEnd) throw new Error("A pack period is required");
  const id = await createAuditPack(c, { title, periodStart: new Date(periodStart), periodEnd: new Date(periodEnd) });
  revalidatePath("/compliance/packs");
  return id;
}

export async function updatePackAction(
  id: string,
  patch: { title?: string; scopeNotes?: string; frameworks?: string[]; selection?: PackSelection },
) {
  const c = await ctx();
  if (!id) throw new Error("A pack is required");
  await updateAuditPack(c, id, patch);
  revalidatePath(`/compliance/packs/${id}`);
}

/** Called by the SignatureCeremony. Quality/accountable-manager role + re-auth verified server-side. */
export async function sealPackAction(id: string, meaning: string, proof: SealProof) {
  const c = await ctx();
  const result = await sealAuditPack(c, { id, meaning, proof });
  revalidatePath(`/compliance/packs/${id}`);
  revalidatePath("/compliance/packs");
  return result;
}
