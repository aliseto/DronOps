"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { createSora, updateSora, approveSora, type SoraInputPatch, type ApproveProof } from "@/server/sora";

async function ctx() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Not authenticated");
  const orgId = await getActiveOrgId(user.id);
  if (!orgId) throw new Error("No active organization");
  return { orgId, userId: user.id };
}

export async function createSoraAction(formData: FormData) {
  const c = await ctx();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("A title is required");
  const id = await createSora(c, { title });
  revalidatePath("/safety/sora");
  return id;
}

export async function updateSoraAction(id: string, patch: SoraInputPatch) {
  const c = await ctx();
  if (!id) throw new Error("A SORA assessment is required");
  await updateSora(c, id, patch);
  revalidatePath(`/safety/sora/${id}`);
  revalidatePath("/safety/sora");
}

export async function approveSoraAction(id: string, meaning: string, proof: ApproveProof) {
  const c = await ctx();
  const result = await approveSora(c, { id, meaning, proof });
  revalidatePath(`/safety/sora/${id}`);
  revalidatePath("/safety/sora");
  return result;
}
