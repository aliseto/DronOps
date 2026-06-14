import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getAdminDb, withTenant, type TenantCtx, type Tx } from "@dronops/db";
import { auditEvents, counters, missions, persons, signatures, soraAssessments } from "@dronops/db/schema";
import {
  determineSora,
  payloadHash,
  type ArcClass,
  type OperationalScenario,
  type Robustness,
  type SoraResult,
  type UaDimensionBand,
} from "@dronops/shared";
import { requireAnyRole, getCurrentPersonId } from "./rbac";
import { verifyPassword } from "./signing";

async function audit(
  tx: Tx,
  ctx: TenantCtx,
  e: { action: string; entityType: string; entityId?: string; before?: unknown; after?: unknown; amr?: string },
) {
  await tx.insert(auditEvents).values({
    orgId: ctx.orgId,
    actorUserId: ctx.userId,
    action: e.action,
    entityType: e.entityType,
    entityId: e.entityId,
    before: e.before ?? null,
    after: e.after ?? null,
    amr: e.amr ?? "password",
  });
}

const isoOrNull = (d: Date | null | undefined) => (d ? d.toISOString() : null);

function inputsOf(r: typeof soraAssessments.$inferSelect) {
  return {
    scenario: r.scenario as OperationalScenario,
    dimension: r.dimension as UaDimensionBand,
    m1: r.m1 as Robustness,
    m2: r.m2 as Robustness,
    m3: r.m3 as Robustness,
    initialArc: r.initialArc as ArcClass,
    arcReduction: r.arcReduction,
  };
}

export interface SoraListItem {
  id: string;
  code: string;
  title: string;
  missionCode: string | null;
  scenario: string;
  sail: number;
  sailRoman: string;
  status: string;
  approvedAt: string | null;
}

export async function listSora(orgId: string): Promise<SoraListItem[]> {
  const db = getAdminDb();
  const rows = await db.select().from(soraAssessments).where(eq(soraAssessments.orgId, orgId)).orderBy(desc(soraAssessments.createdAt));
  const out: SoraListItem[] = [];
  for (const r of rows) {
    let missionCode: string | null = null;
    if (r.missionId) {
      const [m] = await db.select({ code: missions.code }).from(missions).where(eq(missions.id, r.missionId)).limit(1);
      missionCode = m?.code ?? null;
    }
    const det = determineSora(inputsOf(r));
    out.push({ id: r.id, code: r.code, title: r.title, missionCode, scenario: r.scenario, sail: det.sail, sailRoman: det.sailRoman, status: r.status, approvedAt: isoOrNull(r.approvedAt) });
  }
  return out;
}

export interface SoraDetail {
  id: string;
  code: string;
  title: string;
  missionId: string | null;
  missionCode: string | null;
  scenario: OperationalScenario;
  dimension: UaDimensionBand;
  m1: Robustness;
  m2: Robustness;
  m3: Robustness;
  initialArc: ArcClass;
  arcReduction: number;
  status: string;
  determination: SoraResult;
  approvedBy: string | null;
  approvedAt: string | null;
  signature: { signedAtUtc: string; payloadHash: string; method: string } | null;
}

export async function getSoraDetail(orgId: string, id: string): Promise<SoraDetail | null> {
  const db = getAdminDb();
  const [r] = await db.select().from(soraAssessments).where(and(eq(soraAssessments.orgId, orgId), eq(soraAssessments.id, id))).limit(1);
  if (!r) return null;
  const inputs = inputsOf(r);

  let missionCode: string | null = null;
  if (r.missionId) {
    const [m] = await db.select({ code: missions.code }).from(missions).where(eq(missions.id, r.missionId)).limit(1);
    missionCode = m?.code ?? null;
  }
  let approvedBy: string | null = null;
  let signature: SoraDetail["signature"] = null;
  if (r.approvedByPersonId) {
    const [p] = await db.select({ name: persons.name }).from(persons).where(eq(persons.id, r.approvedByPersonId)).limit(1);
    approvedBy = p?.name ?? null;
  }
  if (r.signatureId) {
    const [s] = await db.select().from(signatures).where(eq(signatures.id, r.signatureId)).limit(1);
    if (s) signature = { signedAtUtc: s.signedAt.toISOString(), payloadHash: s.payloadHash, method: s.method };
  }

  return {
    id: r.id,
    code: r.code,
    title: r.title,
    missionId: r.missionId,
    missionCode,
    ...inputs,
    status: r.status,
    determination: determineSora(inputs),
    approvedBy,
    approvedAt: isoOrNull(r.approvedAt),
    signature,
  };
}

export async function createSora(ctx: TenantCtx, input: { title: string; missionId?: string }): Promise<string> {
  await requireAnyRole(ctx.orgId, ctx.userId, ["operations_team", "ops_manager", "accountable_manager"]);
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [c] = await tx
      .insert(counters)
      .values({ orgId: ctx.orgId, key: "sora", value: 1 })
      .onConflictDoUpdate({ target: [counters.orgId, counters.key], set: { value: sql`${counters.value} + 1`, updatedAt: new Date() } })
      .returning({ value: counters.value });
    const code = `SORA-${String(c!.value).padStart(3, "0")}`;
    const [r] = await tx
      .insert(soraAssessments)
      .values({ orgId: ctx.orgId, code, title: input.title, missionId: input.missionId, scenario: "bvlos_sparse", dimension: "3m", initialArc: "b", status: "draft" })
      .returning({ id: soraAssessments.id });
    await audit(tx, ctx, { action: "sora.create", entityType: "sora_assessment", entityId: r!.id, after: { code } });
    return r!.id;
  });
}

export interface SoraInputPatch {
  title?: string;
  scenario?: OperationalScenario;
  dimension?: UaDimensionBand;
  m1?: Robustness;
  m2?: Robustness;
  m3?: Robustness;
  initialArc?: ArcClass;
  arcReduction?: number;
}

export async function updateSora(ctx: TenantCtx, id: string, patch: SoraInputPatch) {
  await requireAnyRole(ctx.orgId, ctx.userId, ["operations_team", "ops_manager", "accountable_manager"]);
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [r] = await tx.select().from(soraAssessments).where(and(eq(soraAssessments.orgId, ctx.orgId), eq(soraAssessments.id, id))).limit(1);
    if (!r) throw new Error("SORA assessment not found");
    if (r.status === "approved") throw new Error("an approved SORA assessment is immutable");
    const set: Record<string, unknown> = { updatedAt: new Date() };
    for (const k of ["title", "scenario", "dimension", "m1", "m2", "m3", "initialArc", "arcReduction"] as const) {
      if (patch[k] !== undefined) set[k] = patch[k];
    }
    await tx.update(soraAssessments).set(set).where(eq(soraAssessments.id, id));
    await audit(tx, ctx, { action: "sora.update", entityType: "sora_assessment", entityId: id });
  });
}

export interface ApproveProof {
  method: "password" | "passkey";
  password?: string;
  credentialId?: string;
}

/** Approve a SORA assessment — re-auth, freeze the determination, bind a signature, make immutable. */
export async function approveSora(ctx: TenantCtx, input: { id: string; meaning: string; proof: ApproveProof }) {
  await requireAnyRole(ctx.orgId, ctx.userId, ["ops_manager", "accountable_manager"]);
  const signerPersonId = await getCurrentPersonId(ctx.orgId, ctx.userId);
  if (!signerPersonId) throw new Error("No person record for the signer");
  if (input.proof.method === "password") {
    if (!input.proof.password || !(await verifyPassword(ctx.userId, input.proof.password))) {
      throw new Error("Password re-authentication failed");
    }
  } else if (!input.proof.credentialId) {
    throw new Error("Passkey re-authentication required");
  }
  const amr = input.proof.method === "passkey" ? "webauthn" : "password";

  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [r] = await tx.select().from(soraAssessments).where(and(eq(soraAssessments.orgId, ctx.orgId), eq(soraAssessments.id, input.id))).limit(1);
    if (!r) throw new Error("SORA assessment not found");
    if (r.status !== "draft") throw new Error("only a draft assessment can be approved");

    const det = determineSora(inputsOf(r));
    const approvedAt = new Date();
    const hash = await payloadHash({ code: r.code, ...inputsOf(r), determination: det });

    const [sig] = await tx
      .insert(signatures)
      .values({ orgId: ctx.orgId, signerPersonId, meaning: input.meaning, entityType: "sora_assessment", entityId: input.id, payloadHash: hash, method: input.proof.method, credentialId: input.proof.credentialId })
      .returning();
    if (!sig) throw new Error("signature insert failed");
    if (sig.entityType !== "sora_assessment" || sig.entityId !== input.id) throw new Error("signature is not bound to this assessment");

    await tx
      .update(soraAssessments)
      .set({ status: "approved", intrinsicGrc: det.intrinsicGrc, finalGrc: det.finalGrc, residualArc: det.residualArc, sail: det.sail, approvedByPersonId: signerPersonId, signatureId: sig.id, approvedAt, updatedAt: approvedAt })
      .where(eq(soraAssessments.id, input.id));
    await audit(tx, ctx, { action: "sora.approve", entityType: "sora_assessment", entityId: input.id, after: { sail: det.sail, payloadHash: hash }, amr });

    const [signer] = await tx.select({ name: persons.name }).from(persons).where(eq(persons.id, signerPersonId)).limit(1);
    return { signerName: signer?.name ?? "Signer", signedAtUtc: approvedAt.toISOString(), payloadHash: hash, method: input.proof.method };
  });
}
