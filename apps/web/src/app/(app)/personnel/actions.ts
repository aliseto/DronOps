"use server";

import { revalidatePath } from "next/cache";
import { getActiveContext } from "@/server/context";
import * as people from "@/server/personnel";

const s = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  return v === "" ? undefined : v;
};
const req = (fd: FormData, k: string) => {
  const v = s(fd, k);
  if (!v) throw new Error(`${k} is required`);
  return v;
};

export async function createPersonAction(fd: FormData) {
  const ctx = await getActiveContext();
  await people.createPerson(ctx, {
    fullName: req(fd, "fullName"),
    roleTitle: s(fd, "roleTitle"),
    email: s(fd, "email"),
    employmentType: s(fd, "employmentType"),
  });
  revalidatePath("/personnel");
}

export async function addCertAction(fd: FormData) {
  const ctx = await getActiveContext();
  await people.addCertification(ctx, req(fd, "personId"), {
    type: req(fd, "type"),
    issuer: s(fd, "issuer"),
    number: s(fd, "number"),
    issuedOn: s(fd, "issuedOn"),
    expiresOn: s(fd, "expiresOn"),
  });
  revalidatePath("/personnel");
}

export async function addApprovedAction(fd: FormData) {
  const ctx = await getActiveContext();
  await people.addApprovedAircraft(ctx, req(fd, "personId"), {
    droneProfileId: req(fd, "droneProfileId"),
    dateApproved: s(fd, "dateApproved"),
  });
  revalidatePath("/personnel");
}

export async function addSkillAction(fd: FormData) {
  const ctx = await getActiveContext();
  await people.addSkill(ctx, req(fd, "personId"), {
    category: req(fd, "category"),
    name: req(fd, "name"),
    level: s(fd, "level"),
  });
  revalidatePath("/personnel");
}

export async function addDocAction(fd: FormData) {
  const ctx = await getActiveContext();
  await people.addDocument(ctx, "personnel", req(fd, "personId"), {
    title: req(fd, "title"),
    docType: s(fd, "docType"),
    issuedOn: s(fd, "issuedOn"),
    expiresOn: s(fd, "expiresOn"),
  });
  revalidatePath("/personnel");
}

export async function archivePersonAction(fd: FormData) {
  const ctx = await getActiveContext();
  await people.archivePerson(ctx, req(fd, "id"));
  revalidatePath("/personnel");
}
