"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId, setActiveOrgCookie } from "@/server/active-org";
import {
  createOrganization,
  disableJurisdiction,
  enableJurisdiction,
  inviteMember,
} from "@/server/org";

async function actor() {
  const user = await getCurrentUser();
  if (!user?.id || !user.email) throw new Error("Not authenticated");
  return { userId: user.id, email: user.email };
}

export async function createOrgAction(formData: FormData) {
  const a = await actor();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const org = await createOrganization(a, name);
  await setActiveOrgCookie(org.id);
  revalidatePath("/onboarding");
}

export async function toggleJurisdictionAction(formData: FormData) {
  const a = await actor();
  const key = String(formData.get("key") ?? "");
  const isEnabled = String(formData.get("enabled") ?? "") === "true";
  const orgId = await getActiveOrgId(a.userId);
  if (!orgId || !key) return;
  if (isEnabled) await disableJurisdiction(a, orgId, key);
  else await enableJurisdiction(a, orgId, key);
  revalidatePath("/onboarding");
}

export async function inviteMemberAction(formData: FormData) {
  const a = await actor();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "member") === "admin" ? "admin" : "member";
  const orgId = await getActiveOrgId(a.userId);
  if (!orgId || !email) return;
  await inviteMember(a, orgId, email, role);
  revalidatePath("/onboarding");
}
