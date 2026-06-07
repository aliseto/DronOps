import { EMPTY_FORM_SCHEMA, formSchema } from "@dronops/shared";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getTemplate, listTemplates } from "@/server/form-templates";
import { FormsView } from "./FormsView";

export default async function FormsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await getCurrentUser();
  const orgId = user?.id ? await getActiveOrgId(user.id) : null;
  const templates = orgId ? await listTemplates(orgId) : [];

  const sp = await searchParams;
  const editId = sp.edit;
  let editing = null;
  if (orgId && editId) {
    const t = await getTemplate(orgId, editId);
    if (t && t.status === "draft") {
      const parsed = formSchema.safeParse(t.schema);
      editing = {
        id: t.id,
        code: t.code,
        version: t.version,
        title: t.title,
        schema: parsed.success ? parsed.data : EMPTY_FORM_SCHEMA,
      };
    }
  }

  return (
    <FormsView
      templates={templates.map((t) => ({
        id: t.id,
        code: t.code,
        version: t.version,
        title: t.title,
        appliesTo: t.appliesTo,
        status: t.status,
      }))}
      editing={editing}
    />
  );
}
