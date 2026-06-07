"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import {
  addAircraft,
  addComponent,
  logMaintenance,
  setAircraftCondition,
} from "@/server/fleet";

async function ctx() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Not authenticated");
  const orgId = await getActiveOrgId(user.id);
  if (!orgId) throw new Error("No active organization");
  return { orgId, userId: user.id };
}

const str = (v: FormDataEntryValue | null) => String(v ?? "").trim() || undefined;
const date = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s ? new Date(s) : undefined;
};

export async function addAircraftAction(formData: FormData) {
  const c = await ctx();
  const label = String(formData.get("label") ?? "").trim();
  const airframeClass = String(formData.get("airframeClass") ?? "").trim();
  if (!label || !airframeClass) throw new Error("Label and airframe class are required");
  await addAircraft(c, {
    label,
    airframeClass,
    identifier: str(formData.get("identifier")),
    manufacturer: str(formData.get("manufacturer")),
    model: str(formData.get("model")),
    gacaClass: str(formData.get("gacaClass")),
    registrationNo: str(formData.get("registrationNo")),
    registrationJurisdiction: str(formData.get("registrationJurisdiction")),
    registrationExpiresAt: date(formData.get("registrationExpiresAt")),
    firmwareVersion: str(formData.get("firmwareVersion")),
  });
  revalidatePath("/fleet");
}

export async function setConditionAction(formData: FormData) {
  const c = await ctx();
  const id = String(formData.get("aircraftId") ?? "");
  const condition = String(formData.get("condition") ?? "") as
    | "operational"
    | "in_maintenance"
    | "grounded";
  if (!id || !["operational", "in_maintenance", "grounded"].includes(condition)) {
    throw new Error("Aircraft and a valid condition are required");
  }
  await setAircraftCondition(c, id, condition, str(formData.get("note")));
  revalidatePath("/fleet");
}

export async function addComponentAction(formData: FormData) {
  const c = await ctx();
  const aircraftId = String(formData.get("aircraftId") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  if (!aircraftId || !kind || !label) throw new Error("Aircraft, kind and label are required");
  await addComponent(c, {
    aircraftId,
    kind,
    label,
    serialNo: str(formData.get("serialNo")),
    firmwareVersion: str(formData.get("firmwareVersion")),
  });
  revalidatePath("/fleet");
}

export async function logMaintenanceAction(formData: FormData) {
  const c = await ctx();
  const aircraftId = String(formData.get("aircraftId") ?? "");
  const type = String(formData.get("type") ?? "");
  const performedAt = date(formData.get("performedAt"));
  const description = String(formData.get("description") ?? "").trim();
  if (!aircraftId || !type || !performedAt || !description) {
    throw new Error("Aircraft, type, date and description are required");
  }
  await logMaintenance(c, {
    aircraftId,
    type,
    performedAt,
    description,
    performedByName: str(formData.get("performedByName")),
    nextDueAt: date(formData.get("nextDueAt")),
  });
  revalidatePath("/fleet");
}
