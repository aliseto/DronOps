"use server";

import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { withRls } from "@/lib/db";

export async function acceptInvitationAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  const token = String(formData.get("token") ?? "");

  let error = "";
  try {
    await withRls({ sub: user.id, email: user.email }, (db) =>
      db.execute(sql`select app.accept_invitation(${token})`),
    );
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not accept invitation";
  }
  if (error) redirect(`/invite?token=${encodeURIComponent(token)}&error=${encodeURIComponent(error)}`);
  redirect("/");
}
