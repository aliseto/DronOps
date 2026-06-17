"use server";

import { revalidatePath } from "next/cache";
import { getActiveContext } from "@/server/context";
import * as ops from "@/server/operations";

const s = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  return v === "" ? undefined : v;
};
const req = (fd: FormData, k: string) => {
  const v = s(fd, k);
  if (!v) throw new Error(`${k} is required`);
  return v;
};

export async function createClientAction(fd: FormData) {
  const ctx = await getActiveContext();
  await ops.createClient(ctx, { company: req(fd, "company"), industry: s(fd, "industry") });
  revalidatePath("/operations");
}

export async function createProjectAction(fd: FormData) {
  const ctx = await getActiveContext();
  await ops.createProject(ctx, { name: req(fd, "name"), description: s(fd, "description"), clientId: s(fd, "clientId") });
  revalidatePath("/operations");
}

export async function createMissionAction(fd: FormData) {
  const ctx = await getActiveContext();
  await ops.createMission(ctx, {
    title: req(fd, "title"),
    projectId: s(fd, "projectId"),
    operationCategory: s(fd, "operationCategory"),
    plannedStart: s(fd, "plannedStart"),
  });
  revalidatePath("/operations");
}

export async function submitMissionAction(fd: FormData) {
  const ctx = await getActiveContext();
  await ops.submitMission(ctx, req(fd, "id"));
  revalidatePath("/operations");
}

export async function approveMissionAction(fd: FormData) {
  const ctx = await getActiveContext();
  await ops.recordApproval(ctx, req(fd, "id"), {
    approvingAuthority: req(fd, "approvingAuthority"),
    approvalReference: req(fd, "approvalReference"),
    approvedAt: s(fd, "approvedAt"),
  });
  revalidatePath("/operations");
}

export async function completeMissionAction(fd: FormData) {
  const ctx = await getActiveContext();
  await ops.completeMission(ctx, req(fd, "id"));
  revalidatePath("/operations");
}

export async function cancelMissionAction(fd: FormData) {
  const ctx = await getActiveContext();
  await ops.cancelMission(ctx, req(fd, "id"), req(fd, "reason"));
  revalidatePath("/operations");
}
