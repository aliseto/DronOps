"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { ensurePersonForMember, grantRole, revokeRole } from "@/server/access";

async function ctx() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Not authenticated");
  const orgId = await getActiveOrgId(user.id);
  if (!orgId) throw new Error("No active organization");
  return { orgId, userId: user.id };
}

export async function ensurePersonAction(userId: string, name: string, email?: string) {
  await ensurePersonForMember(await ctx(), { userId, name, email });
  revalidatePath("/settings/access");
}

export async function grantRoleAction(personId: string, role: string) {
  await grantRole(await ctx(), personId, role);
  revalidatePath("/settings/access");
}

export async function revokeRoleAction(personId: string, role: string) {
  await revokeRole(await ctx(), personId, role);
  revalidatePath("/settings/access");
}
