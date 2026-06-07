"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getCurrentPersonId } from "@/server/rbac";
import {
  addCredential,
  addPerson,
  logDuty,
  logRecencyEvent,
  recordReadinessOverride,
  renewCredential,
  verifyCredential,
} from "@/server/personnel";

async function ctx() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Not authenticated");
  const orgId = await getActiveOrgId(user.id);
  if (!orgId) throw new Error("No active organization");
  return { orgId, userId: user.id };
}

const date = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s ? new Date(s) : undefined;
};
const str = (v: FormDataEntryValue | null) => String(v ?? "").trim() || undefined;

export async function addPersonAction(formData: FormData) {
  const c = await ctx();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required");
  await addPerson(c, { name, identityNo: str(formData.get("identityNo")), email: str(formData.get("email")) });
  revalidatePath("/personnel");
}

export async function addCredentialAction(formData: FormData) {
  const c = await ctx();
  const personId = String(formData.get("personId") ?? "");
  const kind = String(formData.get("kind") ?? "");
  if (!personId || !kind) throw new Error("Person and credential kind are required");
  await addCredential(c, {
    personId,
    kind,
    credentialNo: str(formData.get("credentialNo")),
    issuedAt: date(formData.get("issuedAt")),
    expiresAt: date(formData.get("expiresAt")),
  });
  revalidatePath("/personnel");
}

export async function verifyCredentialAction(credentialId: string) {
  const c = await ctx();
  const verifierPersonId = await getCurrentPersonId(c.orgId, c.userId);
  if (!verifierPersonId) throw new Error("No person record for the verifier");
  await verifyCredential(c, credentialId, verifierPersonId);
  revalidatePath("/personnel");
}

export async function renewCredentialAction(formData: FormData) {
  const c = await ctx();
  const credentialId = String(formData.get("credentialId") ?? "");
  if (!credentialId) throw new Error("Credential is required");
  await renewCredential(c, credentialId, {
    credentialNo: str(formData.get("credentialNo")),
    issuedAt: date(formData.get("issuedAt")),
    expiresAt: date(formData.get("expiresAt")),
  });
  revalidatePath("/personnel");
}

export async function logRecencyAction(formData: FormData) {
  const c = await ctx();
  const personId = String(formData.get("personId") ?? "");
  const eventType = String(formData.get("eventType") ?? "flight");
  const occurredAt = date(formData.get("occurredAt"));
  if (!personId || !occurredAt) throw new Error("Person and date are required");
  const recordedByPersonId = (await getCurrentPersonId(c.orgId, c.userId)) ?? undefined;
  await logRecencyEvent(c, {
    personId,
    eventType,
    airframeClass: str(formData.get("airframeClass")),
    occurredAt,
    recordedByPersonId,
  });
  revalidatePath("/personnel");
}

export async function logDutyAction(formData: FormData) {
  const c = await ctx();
  const personId = String(formData.get("personId") ?? "");
  const startAt = date(formData.get("startAt"));
  const endAt = date(formData.get("endAt"));
  if (!personId || !startAt || !endAt) throw new Error("Person, start and end are required");
  if (endAt <= startAt) throw new Error("End must be after start");
  await logDuty(c, { personId, startAt, endAt, missionRef: str(formData.get("missionRef")) });
  revalidatePath("/personnel");
}

export async function overrideReadinessAction(formData: FormData) {
  const c = await ctx();
  await recordReadinessOverride(c, {
    personId: String(formData.get("personId") ?? ""),
    airframeClass: String(formData.get("airframeClass") ?? ""),
    jurisdiction: String(formData.get("jurisdiction") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });
  revalidatePath("/personnel");
}
