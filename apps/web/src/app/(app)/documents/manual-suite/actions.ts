"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { loadManualSuite, saveTemplateParams } from "@/server/manual-suite";

async function ctx() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Not authenticated");
  const orgId = await getActiveOrgId(user.id);
  if (!orgId) throw new Error("No active organization");
  return { orgId, userId: user.id };
}

export async function saveParamsAction(params: Record<string, Record<string, unknown>>) {
  await saveTemplateParams(await ctx(), params);
  revalidatePath("/documents/manual-suite");
}

export async function loadSuiteAction() {
  const result = await loadManualSuite(await ctx());
  revalidatePath("/documents/manual-suite");
  revalidatePath("/documents");
  return result;
}
