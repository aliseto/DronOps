import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getAdminDb, withTenant, type TenantCtx, type Tx } from "@dronops/db";
import { auditEvents, counters, findings, managementReviews, persons, signatures } from "@dronops/db/schema";
import { payloadHash, summarizeReviewInputs, type ReviewInputsSnapshot } from "@dronops/shared";
import { requireAnyRole, getCurrentPersonId } from "./rbac";
import { verifyPassword } from "./signing";
import { getCoverageMatrix } from "./compliance";
import { listCrew } from "./personnel";
import { listFleet } from "./fleet";
import { listMissions } from "./operations";

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

/**
 * Assemble the ISO 9.3 operational inputs as of `asOf` for the given period.
 * Pure aggregation (summarizeReviewInputs) over existing M2/M4/M5/M7 data — no
 * new analytics, no commercial data.
 */
export async function assembleReviewInputs(
  orgId: string,
  periodStart: Date,
  periodEnd: Date,
  asOf: Date,
): Promise<ReviewInputsSnapshot> {
  const [coverage, crew, fleet, missions, findingRows] = await Promise.all([
    getCoverageMatrix(orgId),
    listCrew(orgId),
    listFleet(orgId),
    listMissions(orgId),
    getAdminDb()
      .select({ status: findings.status, level: findings.level, source: findings.source, dueAt: findings.dueAt, createdAt: findings.createdAt })
      .from(findings)
      .where(eq(findings.orgId, orgId)),
  ]);
  return summarizeReviewInputs({
    coverage: { pct: coverage.totals.pct, total: coverage.totals.total, covered: coverage.totals.covered, partial: coverage.totals.partial, gap: coverage.totals.gap },
    findings: findingRows.map((f) => ({ status: f.status, level: f.level, source: f.source, dueAt: isoOrNull(f.dueAt), createdAt: f.createdAt.toISOString() })),
    crew: crew.map((c) => ({ isPilot: c.roles.includes("pilot"), blocked: c.blocksAssignment, expiringCredentials: c.expiring90 })),
    fleet: fleet.map((x) => ({ status: x.status })),
    missions: missions.map((m) => ({ status: m.status, plannedStartAt: m.plannedStartAt })),
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    asOf: asOf.toISOString(),
  });
}

export interface ReviewListItem {
  id: string;
  code: string;
  title: string | null;
  periodStart: string;
  periodEnd: string;
  status: string;
  signedAt: string | null;
}

export async function listManagementReviews(orgId: string): Promise<ReviewListItem[]> {
  const rows = await getAdminDb().select().from(managementReviews).where(eq(managementReviews.orgId, orgId)).orderBy(desc(managementReviews.periodEnd));
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    title: r.title,
    periodStart: r.periodStart.toISOString(),
    periodEnd: r.periodEnd.toISOString(),
    status: r.status,
    signedAt: isoOrNull(r.signedAt),
  }));
}

export interface ReviewDetail {
  id: string;
  code: string;
  title: string | null;
  periodStart: string;
  periodEnd: string;
  status: string;
  priorActions: string | null;
  customerFeedback: string | null;
  riskEffectiveness: string | null;
  improvements: string | null;
  resourceNotes: string | null;
  outputs: string | null;
  /** Live (draft) or frozen (signed) §9.3 metrics. */
  inputs: ReviewInputsSnapshot;
  signedBy: string | null;
  signedAt: string | null;
  signature: { signedAtUtc: string; payloadHash: string; method: string } | null;
}

export async function getManagementReviewDetail(orgId: string, id: string): Promise<ReviewDetail | null> {
  const db = getAdminDb();
  const [r] = await db.select().from(managementReviews).where(and(eq(managementReviews.orgId, orgId), eq(managementReviews.id, id))).limit(1);
  if (!r) return null;

  // Signed → use the frozen snapshot; draft → assemble live.
  const inputs = (r.status === "signed" && r.inputsSnapshot
    ? (r.inputsSnapshot as ReviewInputsSnapshot)
    : await assembleReviewInputs(orgId, r.periodStart, r.periodEnd, new Date()));

  let signedBy: string | null = null;
  let signature: ReviewDetail["signature"] = null;
  if (r.signedByPersonId) {
    const [p] = await db.select({ name: persons.name }).from(persons).where(eq(persons.id, r.signedByPersonId)).limit(1);
    signedBy = p?.name ?? null;
  }
  if (r.signatureId) {
    const [s] = await db.select().from(signatures).where(eq(signatures.id, r.signatureId)).limit(1);
    if (s) signature = { signedAtUtc: s.signedAt.toISOString(), payloadHash: s.payloadHash, method: s.method };
  }

  return {
    id: r.id,
    code: r.code,
    title: r.title,
    periodStart: r.periodStart.toISOString(),
    periodEnd: r.periodEnd.toISOString(),
    status: r.status,
    priorActions: r.priorActions,
    customerFeedback: r.customerFeedback,
    riskEffectiveness: r.riskEffectiveness,
    improvements: r.improvements,
    resourceNotes: r.resourceNotes,
    outputs: r.outputs,
    inputs,
    signedBy,
    signedAt: isoOrNull(r.signedAt),
    signature,
  };
}

export async function createManagementReview(
  ctx: TenantCtx,
  input: { periodStart: Date; periodEnd: Date; title?: string },
): Promise<string> {
  if (input.periodEnd < input.periodStart) throw new Error("Period end must be after the start");
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [c] = await tx
      .insert(counters)
      .values({ orgId: ctx.orgId, key: "management_review", value: 1 })
      .onConflictDoUpdate({ target: [counters.orgId, counters.key], set: { value: sql`${counters.value} + 1`, updatedAt: new Date() } })
      .returning({ value: counters.value });
    const code = `MR-${String(c!.value).padStart(3, "0")}`;
    const [r] = await tx
      .insert(managementReviews)
      .values({ orgId: ctx.orgId, code, title: input.title, periodStart: input.periodStart, periodEnd: input.periodEnd, status: "draft" })
      .returning({ id: managementReviews.id });
    await audit(tx, ctx, { action: "management_review.create", entityType: "management_review", entityId: r!.id, after: { code } });
    return r!.id;
  });
}

const NARRATIVE = ["priorActions", "customerFeedback", "riskEffectiveness", "improvements", "resourceNotes", "outputs"] as const;
type NarrativeField = (typeof NARRATIVE)[number];

/** Edit the narrative §9.3 inputs/outputs on a DRAFT review (signed is immutable). */
export async function updateManagementReview(ctx: TenantCtx, id: string, patch: Partial<Record<NarrativeField, string>>) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [r] = await tx.select().from(managementReviews).where(and(eq(managementReviews.orgId, ctx.orgId), eq(managementReviews.id, id))).limit(1);
    if (!r) throw new Error("review not found");
    if (r.status === "signed") throw new Error("a signed review is immutable");
    const set: Record<string, unknown> = { updatedAt: new Date() };
    for (const k of NARRATIVE) if (k in patch) set[k] = patch[k] ?? null;
    await tx.update(managementReviews).set(set).where(eq(managementReviews.id, id));
    await audit(tx, ctx, { action: "management_review.update", entityType: "management_review", entityId: id });
  });
}

export interface SignProof {
  method: "password" | "passkey";
  password?: string;
  credentialId?: string;
}

/**
 * Accountable-manager Tier-3 sign-off (mirrors approveRevision): role-gate →
 * re-auth → freeze the §9.3 snapshot → record a signature BOUND to this review →
 * assert the binding → status `signed` (immutable thereafter). Atomic + audited.
 */
export async function signManagementReview(ctx: TenantCtx, input: { id: string; meaning: string; proof: SignProof }) {
  await requireAnyRole(ctx.orgId, ctx.userId, ["accountable_manager"]);
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
    const [r] = await tx.select().from(managementReviews).where(and(eq(managementReviews.orgId, ctx.orgId), eq(managementReviews.id, input.id))).limit(1);
    if (!r) throw new Error("review not found");
    if (r.status !== "draft") throw new Error("only a draft review can be signed");

    const signedAt = new Date();
    const snapshot = await assembleReviewInputs(ctx.orgId, r.periodStart, r.periodEnd, signedAt);
    const hash = await payloadHash({
      code: r.code,
      periodStart: r.periodStart.toISOString(),
      periodEnd: r.periodEnd.toISOString(),
      priorActions: r.priorActions,
      customerFeedback: r.customerFeedback,
      riskEffectiveness: r.riskEffectiveness,
      improvements: r.improvements,
      resourceNotes: r.resourceNotes,
      outputs: r.outputs,
      inputs: snapshot,
    });

    const [sig] = await tx
      .insert(signatures)
      .values({ orgId: ctx.orgId, signerPersonId, meaning: input.meaning, entityType: "management_review", entityId: input.id, payloadHash: hash, method: input.proof.method, credentialId: input.proof.credentialId })
      .returning();
    if (!sig) throw new Error("signature insert failed");
    if (sig.entityType !== "management_review" || sig.entityId !== input.id) throw new Error("signature is not bound to this review");

    await tx
      .update(managementReviews)
      .set({ status: "signed", inputsSnapshot: snapshot, signedByPersonId: signerPersonId, signatureId: sig.id, signedAt, updatedAt: signedAt })
      .where(eq(managementReviews.id, input.id));
    await audit(tx, ctx, { action: "management_review.sign", entityType: "management_review", entityId: input.id, after: { payloadHash: hash }, amr });

    const [signer] = await tx.select({ name: persons.name }).from(persons).where(eq(persons.id, signerPersonId)).limit(1);
    return { signerName: signer?.name ?? "Signer", signedAtUtc: signedAt.toISOString(), payloadHash: hash, method: input.proof.method };
  });
}
