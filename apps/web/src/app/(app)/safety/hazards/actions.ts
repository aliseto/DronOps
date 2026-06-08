"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import {
  createHazard,
  updateHazard,
  reviewHazard,
  createHazardFromDeviation,
  type UpdateHazardPatch,
} from "@/server/hazards";

async function ctx() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Not authenticated");
  const orgId = await getActiveOrgId(user.id);
  if (!orgId) throw new Error("No active organization");
  return { orgId, userId: user.id };
}

export async function createHazardAction(formData: FormData) {
  const c = await ctx();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("A hazard title is required");
  const category = String(formData.get("category") ?? "").trim() || undefined;
  const id = await createHazard(c, { title, category, description: String(formData.get("description") ?? "").trim() || undefined });
  revalidatePath("/safety/hazards");
  return id;
}

export async function updateHazardAction(id: string, patch: UpdateHazardPatch) {
  const c = await ctx();
  if (!id) throw new Error("A hazard is required");
  await updateHazard(c, id, patch);
  revalidatePath(`/safety/hazards/${id}`);
  revalidatePath("/safety/hazards");
}

export async function reviewHazardAction(id: string) {
  const c = await ctx();
  await reviewHazard(c, id);
  revalidatePath(`/safety/hazards/${id}`);
  revalidatePath("/safety/hazards");
}

export async function createHazardFromDeviationAction(deviationCode: string) {
  const c = await ctx();
  const id = await createHazardFromDeviation(c, deviationCode);
  revalidatePath("/safety/hazards");
  return id;
}
