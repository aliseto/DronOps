"use server";

import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { schema } from "@dom/db";
import { createTenantInput, REGULATOR_CODES, type RegulatorCode } from "@dom/core";
import { getSessionUser } from "@/lib/session";
import { withRls } from "@/lib/db";

const JURISDICTION: Record<RegulatorCode, string> = {
  GCAA: "UAE",
  DCAA: "UAE",
  GACA: "KSA",
  OMAN: "OMAN",
};

export async function createTenantAndOrgAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  const tenantName = String(formData.get("tenantName") ?? "").trim();
  const orgName = String(formData.get("orgName") ?? "").trim();
  const regulatorCode = String(formData.get("regulatorCode") ?? "GCAA") as RegulatorCode;

  createTenantInput.parse({ tenantName });
  if (!orgName) throw new Error("Enter an organisation name");
  if (!REGULATOR_CODES.includes(regulatorCode)) throw new Error("Unknown regulator");

  const claims = { sub: user.id, email: user.email };
  await withRls(claims, async (db) => {
    const tenant = (await db.execute(
      sql`select app.create_tenant(${tenantName}) as id`,
    )) as unknown as { id: string }[];
    const reg = (await db.execute(
      sql`select id from public.regulators where code = ${regulatorCode}`,
    )) as unknown as { id: string }[];
    await db.insert(schema.organisations).values({
      tenantId: tenant[0]!.id,
      name: orgName,
      primaryRegulatorId: reg[0]!.id,
      jurisdiction: JURISDICTION[regulatorCode],
    });
  });

  redirect("/");
}
