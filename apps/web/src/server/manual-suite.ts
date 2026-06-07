import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getAdminDb, withTenant, type TenantCtx } from "@dronops/db";
import {
  auditEvents,
  documents,
  documentRevisions,
  formTemplates,
  orgTemplateParams,
} from "@dronops/db/schema";
import {
  applicableDocs,
  applyParamDefaults,
  manifestDocNumber,
  renderManualBody,
  STUB_BODIES,
  FORM_MANIFEST,
} from "@dronops/content";
import { EMPTY_FORM_SCHEMA } from "@dronops/shared";
import { createDocument, updateDraftRevision } from "./documents";
import { createTemplateDraft } from "./form-templates";
import { listEnabledJurisdictions } from "./org";

type Params = Record<string, Record<string, unknown>>;

const ROLE_PARAM_KEY: Record<string, string> = {
  accountable_manager: "accountable_manager",
  quality_manager: "quality_manager",
  ops_manager: "operations_manager",
};

export async function getTemplateParams(orgId: string): Promise<Params> {
  const [row] = await getAdminDb()
    .select({ params: orgTemplateParams.params })
    .from(orgTemplateParams)
    .where(eq(orgTemplateParams.orgId, orgId))
    .limit(1);
  return (row?.params as Params) ?? {};
}

export async function saveTemplateParams(ctx: TenantCtx, params: Params) {
  await withTenant(getAdminDb(), ctx, async (tx) => {
    await tx
      .insert(orgTemplateParams)
      .values({ orgId: ctx.orgId, params, updatedBy: ctx.userId })
      .onConflictDoUpdate({
        target: orgTemplateParams.orgId,
        set: { params, updatedBy: ctx.userId, updatedAt: new Date() },
      });
    await tx.insert(auditEvents).values({
      orgId: ctx.orgId,
      actorUserId: ctx.userId,
      action: "manual_suite.params_save",
      entityType: "org_template_params",
      amr: "password",
    });
  });
}

export interface PreviewDoc {
  source: string;
  number: string;
  title: string;
  category: string;
  ownerRole: string;
  missing: string[];
  action: "create" | "update-draft" | "skip-approved";
}

async function findDoc(orgId: string, docNo: string) {
  const [d] = await getAdminDb()
    .select()
    .from(documents)
    .where(and(eq(documents.orgId, orgId), eq(documents.docNo, docNo)))
    .limit(1);
  return d ?? null;
}

async function latestRevision(orgId: string, documentId: string) {
  const [r] = await getAdminDb()
    .select()
    .from(documentRevisions)
    .where(and(eq(documentRevisions.orgId, orgId), eq(documentRevisions.documentId, documentId)))
    .orderBy(desc(documentRevisions.revNo))
    .limit(1);
  return r ?? null;
}

export async function previewManualSuite(orgId: string) {
  const params = applyParamDefaults(await getTemplateParams(orgId));
  const enabled = await listEnabledJurisdictions(orgId);
  const docs: PreviewDoc[] = [];
  for (const d of applicableDocs(params)) {
    const number = manifestDocNumber(d, params);
    const { missing } = renderManualBody(STUB_BODIES[d.source] ?? "", params, enabled);
    const existing = await findDoc(orgId, number);
    let action: PreviewDoc["action"] = "create";
    if (existing) {
      const rev = await latestRevision(orgId, existing.id);
      action = rev && rev.status === "draft" ? "update-draft" : "skip-approved";
    }
    docs.push({
      source: d.source,
      number,
      title: d.title,
      category: d.category,
      ownerRole: d.ownerRole,
      missing,
      action,
    });
  }
  const allResolved = docs.every((d) => d.missing.length === 0);
  return { docs, allResolved };
}

export async function loadManualSuite(ctx: TenantCtx) {
  const params = applyParamDefaults(await getTemplateParams(ctx.orgId));
  const enabled = await listEnabledJurisdictions(ctx.orgId);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const d of applicableDocs(params)) {
    const number = manifestDocNumber(d, params);
    const { rendered, missing } = renderManualBody(STUB_BODIES[d.source] ?? "", params, enabled);
    if (missing.length > 0) {
      throw new Error(`Unresolved variables in ${number}: ${missing.join(", ")}`);
    }
    const ownerPersonId = params.postholders?.[ROLE_PARAM_KEY[d.ownerRole] ?? ""] as
      | string
      | undefined;

    const existing = await findDoc(ctx.orgId, number);
    if (!existing) {
      const { revision } = await createDocument(ctx, {
        category: d.category,
        title: d.title,
        customNumber: number,
        ownerPersonId: ownerPersonId || undefined,
      });
      await updateDraftRevision(ctx, revision.id, {
        bodyRich: rendered,
        changeSummary: "Preloaded from manual suite",
      });
      created++;
    } else {
      const rev = await latestRevision(ctx.orgId, existing.id);
      if (rev && rev.status === "draft") {
        await updateDraftRevision(ctx, rev.id, { bodyRich: rendered });
        updated++;
      } else {
        skipped++; // approved revision — never touched
      }
    }
  }

  // Forms map to platform templates, not documents (spec §4). Seed missing ones.
  for (const f of FORM_MANIFEST) {
    const [exists] = await getAdminDb()
      .select({ id: formTemplates.id })
      .from(formTemplates)
      .where(and(eq(formTemplates.orgId, ctx.orgId), eq(formTemplates.code, f.code)))
      .limit(1);
    if (!exists) {
      await createTemplateDraft(ctx, {
        code: f.code,
        title: f.title,
        appliesTo: f.appliesTo,
        schema: EMPTY_FORM_SCHEMA,
      });
    }
  }

  return { created, updated, skipped };
}
