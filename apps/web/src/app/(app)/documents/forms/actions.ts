"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isDocumentCategory } from "@dronops/shared";
import type { AppliesTo, FormSchema } from "@dronops/shared";
import { APPLIES_TO } from "@dronops/shared";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import {
  createTemplateDraft,
  newVersionFromActive,
  publishTemplate,
  updateTemplateDraft,
} from "@/server/form-templates";

// (isDocumentCategory imported to keep the documents action surface consistent;
// not used here directly.)
void isDocumentCategory;

async function ctx() {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Not authenticated");
  const orgId = await getActiveOrgId(user.id);
  if (!orgId) throw new Error("No active organization");
  return { orgId, userId: user.id };
}

export async function createTemplateAction(formData: FormData) {
  const c = await ctx();
  const code = String(formData.get("code") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const appliesToRaw = String(formData.get("appliesTo") ?? "generic");
  const appliesTo = (APPLIES_TO as readonly string[]).includes(appliesToRaw)
    ? (appliesToRaw as AppliesTo)
    : "generic";
  if (!code || !title) throw new Error("Code and title are required");
  const t = await createTemplateDraft(c, { code, title, appliesTo });
  redirect(`/documents/forms?edit=${t.id}`);
}

export async function saveSchemaAction(id: string, title: string, schema: FormSchema) {
  await updateTemplateDraft(await ctx(), id, { title, schema });
  revalidatePath("/documents/forms");
}

export async function publishTemplateAction(id: string) {
  await publishTemplate(await ctx(), id);
  revalidatePath("/documents/forms");
}

export async function newVersionAction(code: string) {
  const draft = await newVersionFromActive(await ctx(), code);
  redirect(`/documents/forms?edit=${draft.id}`);
}
