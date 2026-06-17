"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { inviteInput } from "@dom/core";
import { getSessionUser } from "@/lib/session";
import { withRls } from "@/lib/db";

export async function inviteAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  const tenantId = String(formData.get("tenantId") ?? "");
  const level = String(formData.get("level") ?? "org") as "tenant" | "org";
  const orgId = level === "org" ? String(formData.get("orgId") ?? "") || null : null;
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "");

  inviteInput.parse({ tenantId, orgId, email, level, role });

  const token = randomUUID();
  await withRls({ sub: user.id, email: user.email }, (db) =>
    db.execute(sql`select app.create_invitation(${tenantId}, ${orgId}, ${email}, ${role}, ${token})`),
  );
  revalidatePath("/members");
}

export async function revokeAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  const id = String(formData.get("id") ?? "");
  await withRls({ sub: user.id, email: user.email }, (db) =>
    db.execute(sql`select app.revoke_invitation(${id})`),
  );
  revalidatePath("/members");
}
