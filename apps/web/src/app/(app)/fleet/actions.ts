"use server";

import { revalidatePath } from "next/cache";
import { getActiveContext } from "@/server/context";
import * as fleet from "@/server/fleet";

const s = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  return v === "" ? undefined : v;
};
const req = (fd: FormData, k: string) => {
  const v = s(fd, k);
  if (!v) throw new Error(`${k} is required`);
  return v;
};

export async function addDroneProfileAction(fd: FormData) {
  const ctx = await getActiveContext();
  await fleet.createDroneProfile(ctx, {
    brand: req(fd, "brand"),
    model: req(fd, "model"),
    airframeType: s(fd, "airframeType"),
    propulsion: s(fd, "propulsion"),
  });
  revalidatePath("/fleet");
}
export async function addAircraftAction(fd: FormData) {
  const ctx = await getActiveContext();
  await fleet.createAircraft(ctx, {
    name: req(fd, "name"),
    profileId: s(fd, "profileId"),
    serial: s(fd, "serial"),
    registration: s(fd, "registration"),
  });
  revalidatePath("/fleet");
}

export async function addBatteryProfileAction(fd: FormData) {
  const ctx = await getActiveContext();
  await fleet.createBatteryProfile(ctx, { brand: s(fd, "brand"), model: s(fd, "model"), batteryType: s(fd, "batteryType") });
  revalidatePath("/fleet");
}
export async function addBatteryAction(fd: FormData) {
  const ctx = await getActiveContext();
  await fleet.createBattery(ctx, { profileId: s(fd, "profileId"), serial: s(fd, "serial") });
  revalidatePath("/fleet");
}

export async function addControllerProfileAction(fd: FormData) {
  const ctx = await getActiveContext();
  await fleet.createControllerProfile(ctx, { brand: s(fd, "brand"), model: s(fd, "model"), type: s(fd, "type") });
  revalidatePath("/fleet");
}
export async function addControllerAction(fd: FormData) {
  const ctx = await getActiveContext();
  await fleet.createController(ctx, { profileId: s(fd, "profileId"), rcSerial: s(fd, "rcSerial") });
  revalidatePath("/fleet");
}

export async function addEquipmentProfileAction(fd: FormData) {
  const ctx = await getActiveContext();
  await fleet.createEquipmentProfile(ctx, { brand: s(fd, "brand"), model: s(fd, "model"), category: s(fd, "category") });
  revalidatePath("/fleet");
}
export async function addEquipmentAction(fd: FormData) {
  const ctx = await getActiveContext();
  await fleet.createEquipment(ctx, { name: req(fd, "name"), profileId: s(fd, "profileId"), serial: s(fd, "serial") });
  revalidatePath("/fleet");
}

export async function archiveAssetAction(fd: FormData) {
  const ctx = await getActiveContext();
  await fleet.archiveAsset(
    ctx,
    String(fd.get("kind")) as "aircraft" | "battery" | "controller" | "equipment",
    String(fd.get("id")),
  );
  revalidatePath("/fleet");
}
