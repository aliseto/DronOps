"use server";

import { revalidatePath } from "next/cache";
import { sha256Hex, type MissionState, type OperationalCategory } from "@dronops/shared";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getCurrentPersonId, getPersonRoles } from "@/server/rbac";
import { uploadEvidence } from "@/server/files";
import {
  addLocation,
  addMissionDocument,
  assignCrew,
  confirmGreenZone,
  createMission,
  importLocationsFromKml,
  overrideCrew,
  transitionMission,
} from "@/server/operations";

async function ctx() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Not authenticated");
  const orgId = await getActiveOrgId(user.id);
  if (!orgId) throw new Error("No active organization");
  return { orgId, userId: user.id };
}
async function actorRoles(orgId: string, userId: string): Promise<string[]> {
  const personId = await getCurrentPersonId(orgId, userId);
  return personId ? getPersonRoles(orgId, personId) : [];
}

const str = (v: FormDataEntryValue | null) => String(v ?? "").trim() || undefined;
const dt = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s ? new Date(s) : undefined;
};
const num = (v: FormDataEntryValue | null) => {
  const n = Number(v ?? "");
  return Number.isFinite(n) && String(v ?? "").trim() !== "" ? n : undefined;
};

export async function createMissionAction(formData: FormData) {
  const c = await ctx();
  const title = String(formData.get("title") ?? "").trim();
  const jurisdiction = String(formData.get("jurisdiction") ?? "").trim();
  const operationalCategory = String(formData.get("operationalCategory") ?? "") as OperationalCategory;
  if (!title || !jurisdiction || !["open", "standard", "specific", "advanced"].includes(operationalCategory)) {
    throw new Error("Title, jurisdiction and operational category are required");
  }
  await createMission(c, {
    title,
    jurisdiction,
    operationalCategory,
    aircraftId: str(formData.get("aircraftId")),
    plannedStartAt: dt(formData.get("plannedStartAt")),
    plannedEndAt: dt(formData.get("plannedEndAt")),
    ceilingM: num(formData.get("ceilingM")),
  });
  revalidatePath("/operations");
}

export async function transitionMissionAction(id: string, to: MissionState) {
  const c = await ctx();
  await transitionMission(c, id, to, await actorRoles(c.orgId, c.userId));
  revalidatePath("/operations");
}

export async function recordApprovalAction(formData: FormData) {
  const c = await ctx();
  const id = String(formData.get("missionId") ?? "");
  if (!id) throw new Error("Mission is required");
  // Optional outbound approval document.
  const file = formData.get("approvalFile");
  if (file instanceof File && file.size > 0) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { file: stored } = await uploadEvidence(c, { sha256: await sha256Hex(bytes), bytes, mime: file.type || "application/pdf", size: file.size, name: file.name, grade: "manual" });
    await addMissionDocument(c, { missionId: id, fileId: stored.id, flow: "outbound", kind: str(formData.get("docKind")) ?? "approval_letter", label: file.name });
  }
  await transitionMission(c, id, "approved", await actorRoles(c.orgId, c.userId), {
    authority: str(formData.get("authority")),
    applicationRef: str(formData.get("applicationRef")),
    submittedAt: dt(formData.get("submittedAt")),
    authorizationType: str(formData.get("authorizationType")),
    authorizationRef: str(formData.get("authorizationRef")),
  });
  revalidatePath("/operations");
}

export async function assignCrewAction(formData: FormData) {
  const c = await ctx();
  const missionId = String(formData.get("missionId") ?? "");
  const personId = String(formData.get("personId") ?? "");
  const role = String(formData.get("role") ?? "pilot");
  if (!missionId || !personId) throw new Error("Mission and person are required");
  await assignCrew(c, missionId, personId, role);
  revalidatePath("/operations");
}

export async function overrideCrewAction(formData: FormData) {
  const c = await ctx();
  const missionCrewId = String(formData.get("missionCrewId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const overriddenBy = (await getCurrentPersonId(c.orgId, c.userId)) ?? undefined;
  await overrideCrew(c, missionCrewId, reason, overriddenBy);
  revalidatePath("/operations");
}

export async function addLocationAction(formData: FormData) {
  const c = await ctx();
  const missionId = String(formData.get("missionId") ?? "");
  if (!missionId) throw new Error("Mission is required");
  await addLocation(c, missionId, {
    governorate: str(formData.get("governorate")),
    wilayat: str(formData.get("wilayat")),
    village: str(formData.get("village")),
    latitude: num(formData.get("latitude")),
    longitude: num(formData.get("longitude")),
    ceilingM: num(formData.get("ceilingM")),
  });
  revalidatePath("/operations");
}

export async function importKmlAction(formData: FormData) {
  const c = await ctx();
  const missionId = String(formData.get("missionId") ?? "");
  const file = formData.get("kml");
  if (!missionId || !(file instanceof File) || file.size === 0) throw new Error("Mission and a KML file are required");
  const text = await file.text();
  await importLocationsFromKml(c, missionId, text);
  revalidatePath("/operations");
}

export async function addInboundDocumentAction(formData: FormData) {
  const c = await ctx();
  const missionId = String(formData.get("missionId") ?? "");
  const file = formData.get("file");
  if (!missionId || !(file instanceof File) || file.size === 0) throw new Error("Mission and a file are required");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { file: stored } = await uploadEvidence(c, { sha256: await sha256Hex(bytes), bytes, mime: file.type || "application/octet-stream", size: file.size, name: file.name, grade: "manual" });
  await addMissionDocument(c, { missionId, fileId: stored.id, flow: "inbound", kind: str(formData.get("kind")) ?? "client_doc", label: file.name });
  revalidatePath("/operations");
}

export async function confirmGreenZoneAction(missionId: string) {
  const c = await ctx();
  const personId = await getCurrentPersonId(c.orgId, c.userId);
  if (!personId) throw new Error("No person record for the confirmer");
  await confirmGreenZone(c, missionId, personId);
  revalidatePath("/operations");
}
