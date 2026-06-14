import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getAdminDb, withTenant, type TenantCtx, type Tx } from "@dronops/db";
import { auditEvents, formInstances, formTemplates } from "@dronops/db/schema";
import { EMPTY_FORM_SCHEMA, formSchema, type AppliesTo, type FormSchema } from "@dronops/shared";

type TemplateRow = typeof formTemplates.$inferSelect;

async function audit(tx: Tx, ctx: TenantCtx, e: { action: string; entityId?: string; after?: unknown }) {
  await tx.insert(auditEvents).values({
    orgId: ctx.orgId,
    actorUserId: ctx.userId,
    action: e.action,
    entityType: "form_template",
    entityId: e.entityId,
    after: e.after ?? null,
    amr: "password",
  });
}

async function nextVersion(tx: Tx, orgId: string, code: string): Promise<number> {
  const rows = await tx
    .select({ max: sql<number>`coalesce(max(${formTemplates.version}), 0)` })
    .from(formTemplates)
    .where(and(eq(formTemplates.orgId, orgId), eq(formTemplates.code, code)));
  return Number(rows[0]?.max ?? 0) + 1;
}

export async function createTemplateDraft(
  ctx: TenantCtx,
  input: { code: string; title: string; appliesTo: AppliesTo; schema?: FormSchema },
) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const version = await nextVersion(tx, ctx.orgId, input.code);
    const [t] = await tx
      .insert(formTemplates)
      .values({
        orgId: ctx.orgId,
        code: input.code,
        version,
        title: input.title,
        appliesTo: input.appliesTo,
        status: "draft",
        schema: input.schema ?? EMPTY_FORM_SCHEMA,
      })
      .returning();
    if (!t) throw new Error("template insert failed");
    await audit(tx, ctx, {
      action: "form_template.create",
      entityId: t.id,
      after: { code: input.code, version },
    });
    return t;
  });
}

export async function updateTemplateDraft(
  ctx: TenantCtx,
  id: string,
  patch: { title?: string; schema?: FormSchema },
) {
  if (patch.schema) formSchema.parse(patch.schema); // validate shape before save
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [t] = await tx
      .select()
      .from(formTemplates)
      .where(and(eq(formTemplates.orgId, ctx.orgId), eq(formTemplates.id, id)))
      .limit(1);
    if (!t) throw new Error("template not found");
    if (t.status !== "draft") throw new Error("only draft templates can be edited");
    await tx
      .update(formTemplates)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(formTemplates.id, id));
    await audit(tx, ctx, { action: "form_template.update", entityId: id });
  });
}

/** Publish a draft → active, retiring the previous active version of the code. */
export async function publishTemplate(ctx: TenantCtx, id: string) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [t] = await tx
      .select()
      .from(formTemplates)
      .where(and(eq(formTemplates.orgId, ctx.orgId), eq(formTemplates.id, id)))
      .limit(1);
    if (!t) throw new Error("template not found");
    if (t.status !== "draft") throw new Error("only draft templates can be published");
    formSchema.parse(t.schema);

    const [prev] = await tx
      .select()
      .from(formTemplates)
      .where(
        and(
          eq(formTemplates.orgId, ctx.orgId),
          eq(formTemplates.code, t.code),
          eq(formTemplates.status, "active"),
        ),
      )
      .limit(1);

    await tx
      .update(formTemplates)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(formTemplates.id, id));

    if (prev && prev.id !== id) {
      await tx
        .update(formTemplates)
        .set({ status: "retired", supersededByVersionId: id, supersededAt: new Date() })
        .where(eq(formTemplates.id, prev.id));
      await audit(tx, ctx, {
        action: "form_template.retire",
        entityId: prev.id,
        after: { supersededBy: id },
      });
    }
    await audit(tx, ctx, { action: "form_template.publish", entityId: id });
  });
}

/** Start editing an active template: clone its schema into a new draft (n+1). */
export async function newVersionFromActive(ctx: TenantCtx, code: string) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [active] = await tx
      .select()
      .from(formTemplates)
      .where(
        and(
          eq(formTemplates.orgId, ctx.orgId),
          eq(formTemplates.code, code),
          eq(formTemplates.status, "active"),
        ),
      )
      .limit(1);
    if (!active) throw new Error("no active version to clone");
    const version = await nextVersion(tx, ctx.orgId, code);
    const [draft] = await tx
      .insert(formTemplates)
      .values({
        orgId: ctx.orgId,
        code,
        version,
        title: active.title,
        appliesTo: active.appliesTo,
        status: "draft",
        schema: active.schema,
      })
      .returning();
    if (!draft) throw new Error("clone failed");
    await audit(tx, ctx, { action: "form_template.new_version", entityId: draft.id, after: { version } });
    return draft;
  });
}

/** Create a form instance, pinning the exact template version. */
export async function createInstance(
  ctx: TenantCtx,
  input: { templateId: string; data: unknown; missionId?: string },
) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [t] = await tx
      .select()
      .from(formTemplates)
      .where(and(eq(formTemplates.orgId, ctx.orgId), eq(formTemplates.id, input.templateId)))
      .limit(1);
    if (!t) throw new Error("template not found");
    const [inst] = await tx
      .insert(formInstances)
      .values({
        orgId: ctx.orgId,
        templateId: t.id,
        templateCode: t.code,
        templateVersion: t.version, // pinned
        missionId: input.missionId,
        data: input.data,
        capturedAt: new Date(),
      })
      .returning();
    if (!inst) throw new Error("instance insert failed");
    await audit(tx, ctx, { action: "form_instance.create", entityId: inst.id });
    return inst;
  });
}

// --------------------------------------------------------------- queries
export async function listTemplates(orgId: string): Promise<TemplateRow[]> {
  return getAdminDb()
    .select()
    .from(formTemplates)
    .where(eq(formTemplates.orgId, orgId))
    .orderBy(formTemplates.code, formTemplates.version);
}

export async function getTemplate(orgId: string, id: string): Promise<TemplateRow | null> {
  const [t] = await getAdminDb()
    .select()
    .from(formTemplates)
    .where(and(eq(formTemplates.orgId, orgId), eq(formTemplates.id, id)))
    .limit(1);
  return t ?? null;
}
