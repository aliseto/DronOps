import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getAdminDb, withTenant, type TenantCtx, type Tx } from "@dronops/db";
import { auditEvents, counters, missions, persons, riskAssessments, signatures } from "@dronops/db/schema";
import {
  payloadHash,
  riskAssessmentGate,
  type FlightProfile,
  type RiskGateResult,
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

export interface RiskAssessmentItem {
  id: string;
  code: string;
  profile: FlightProfile;
  title: string;
  status: string;
  residualRisk: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  templateCode: string | null;
  templateVersion: number | null;
}

export async function listRiskAssessments(orgId: string, missionId: string): Promise<RiskAssessmentItem[]> {
  const db = getAdminDb();
  const rows = await db
    .select()
    .from(riskAssessments)
    .where(and(eq(riskAssessments.orgId, orgId), eq(riskAssessments.missionId, missionId)))
    .orderBy(desc(riskAssessments.createdAt));
  const names = new Map<string, string>();
  for (const r of rows) {
    if (r.approvedByPersonId && !names.has(r.approvedByPersonId)) {
      const [p] = await db.select({ name: persons.name }).from(persons).where(eq(persons.id, r.approvedByPersonId)).limit(1);
      if (p) names.set(r.approvedByPersonId, p.name);
    }
  }
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    profile: r.profile,
    title: r.title,
    status: r.status,
    residualRisk: r.residualRisk,
    approvedBy: r.approvedByPersonId ? names.get(r.approvedByPersonId) ?? null : null,
    approvedAt: isoOrNull(r.approvedAt),
    templateCode: r.templateCode,
    templateVersion: r.templateVersion,
  }));
}

/** Profiles covered by an APPROVED assessment on the mission — the gate input. */
export async function approvedProfilesFor(orgId: string, missionId: string): Promise<FlightProfile[]> {
  const rows = await getAdminDb()
    .select({ profile: riskAssessments.profile })
    .from(riskAssessments)
    .where(and(eq(riskAssessments.orgId, orgId), eq(riskAssessments.missionId, missionId), eq(riskAssessments.status, "approved")));
  return rows.map((r) => r.profile);
}

/** Evaluate the risk-assessment gate for a mission row. */
export async function missionRiskGate(
  orgId: string,
  mission: { id: string; operationalCategory: "open" | "standard" | "specific" | "advanced"; flightProfiles: string[] | null },
): Promise<RiskGateResult> {
  const approvedProfiles = await approvedProfilesFor(orgId, mission.id);
  return riskAssessmentGate({
    operationalCategory: mission.operationalCategory,
    flightProfiles: ((mission.flightProfiles ?? []) as FlightProfile[]),
    approvedProfiles,
  });
}

/** Declare the mission's flight profiles (planning). Owned by the ops team. */
export async function setMissionProfiles(ctx: TenantCtx, missionId: string, profiles: FlightProfile[]) {
  await requireAnyRole(ctx.orgId, ctx.userId, ["operations_team", "ops_manager"]);
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [m] = await tx.select().from(missions).where(and(eq(missions.orgId, ctx.orgId), eq(missions.id, missionId))).limit(1);
    if (!m) throw new Error("mission not found");
    await tx.update(missions).set({ flightProfiles: profiles, updatedAt: new Date() }).where(eq(missions.id, missionId));
    await audit(tx, ctx, { action: "mission.set_profiles", entityType: "mission", entityId: missionId, after: { profiles } });
  });
}

export interface CreateRiskAssessmentInput {
  missionId: string;
  profile: FlightProfile;
  title: string;
  templateId?: string;
  templateCode?: string;
  templateVersion?: number;
  data?: unknown;
  residualRisk?: "low" | "medium" | "high";
}

export async function createRiskAssessment(ctx: TenantCtx, input: CreateRiskAssessmentInput): Promise<string> {
  await requireAnyRole(ctx.orgId, ctx.userId, ["operations_team", "ops_manager", "accountable_manager"]);
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [c] = await tx
      .insert(counters)
      .values({ orgId: ctx.orgId, key: "risk_assessment", value: 1 })
      .onConflictDoUpdate({ target: [counters.orgId, counters.key], set: { value: sql`${counters.value} + 1`, updatedAt: new Date() } })
      .returning({ value: counters.value });
    const code = `RA-${String(c!.value).padStart(3, "0")}`;
    const [r] = await tx
      .insert(riskAssessments)
      .values({
        orgId: ctx.orgId,
        code,
        missionId: input.missionId,
        profile: input.profile,
        title: input.title,
        templateId: input.templateId,
        templateCode: input.templateCode,
        templateVersion: input.templateVersion,
        data: input.data ?? null,
        residualRisk: input.residualRisk,
        status: "draft",
      })
      .returning({ id: riskAssessments.id });
    await audit(tx, ctx, { action: "risk_assessment.create", entityType: "risk_assessment", entityId: r!.id, after: { code, profile: input.profile } });
    return r!.id;
  });
}

export async function updateRiskAssessment(
  ctx: TenantCtx,
  id: string,
  patch: { title?: string; data?: unknown; residualRisk?: "low" | "medium" | "high" },
) {
  await requireAnyRole(ctx.orgId, ctx.userId, ["operations_team", "ops_manager", "accountable_manager"]);
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [r] = await tx.select().from(riskAssessments).where(and(eq(riskAssessments.orgId, ctx.orgId), eq(riskAssessments.id, id))).limit(1);
    if (!r) throw new Error("risk assessment not found");
    if (r.status === "approved") throw new Error("an approved risk assessment is immutable");
    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (patch.title !== undefined) set.title = patch.title;
    if (patch.data !== undefined) set.data = patch.data;
    if (patch.residualRisk !== undefined) set.residualRisk = patch.residualRisk;
    await tx.update(riskAssessments).set(set).where(eq(riskAssessments.id, id));
    await audit(tx, ctx, { action: "risk_assessment.update", entityType: "risk_assessment", entityId: id });
  });
}

export interface ApproveProof {
  method: "password" | "passkey";
  password?: string;
  credentialId?: string;
}

/**
 * Approve (sign off) a risk assessment — ops/accountable manager re-auths, a
 * signature is bound to the assessment, status flips to `approved` and the record
 * becomes immutable. Only then does it satisfy the mission approval gate.
 */
export async function approveRiskAssessment(ctx: TenantCtx, input: { id: string; meaning: string; proof: ApproveProof }) {
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
    const [r] = await tx.select().from(riskAssessments).where(and(eq(riskAssessments.orgId, ctx.orgId), eq(riskAssessments.id, input.id))).limit(1);
    if (!r) throw new Error("risk assessment not found");
    if (r.status !== "draft") throw new Error("only a draft assessment can be approved");

    const approvedAt = new Date();
    const hash = await payloadHash({ code: r.code, missionId: r.missionId, profile: r.profile, title: r.title, data: r.data, residualRisk: r.residualRisk });

    const [sig] = await tx
      .insert(signatures)
      .values({ orgId: ctx.orgId, signerPersonId, meaning: input.meaning, entityType: "risk_assessment", entityId: input.id, payloadHash: hash, method: input.proof.method, credentialId: input.proof.credentialId })
      .returning();
    if (!sig) throw new Error("signature insert failed");
    if (sig.entityType !== "risk_assessment" || sig.entityId !== input.id) throw new Error("signature is not bound to this assessment");

    await tx
      .update(riskAssessments)
      .set({ status: "approved", approvedByPersonId: signerPersonId, signatureId: sig.id, approvedAt, updatedAt: approvedAt })
      .where(eq(riskAssessments.id, input.id));
    await audit(tx, ctx, { action: "risk_assessment.approve", entityType: "risk_assessment", entityId: input.id, after: { payloadHash: hash }, amr });

    const [signer] = await tx.select({ name: persons.name }).from(persons).where(eq(persons.id, signerPersonId)).limit(1);
    return { signerName: signer?.name ?? "Signer", signedAtUtc: approvedAt.toISOString(), payloadHash: hash, method: input.proof.method };
  });
}
