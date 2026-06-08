import "server-only";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { getAdminDb, withTenant, type TenantCtx, type Tx } from "@dronops/db";
import { auditEvents, counters, findings, hazards, persons } from "@dronops/db/schema";
import { riskCell, reviewStatus, type RiskBand, type ReviewStatus } from "@dronops/shared";
import { requireAnyRole } from "./rbac";

const SAFETY_ROLES = ["quality_manager", "ops_manager", "accountable_manager"] as const;

async function audit(
  tx: Tx,
  ctx: TenantCtx,
  e: { action: string; entityType: string; entityId?: string; before?: unknown; after?: unknown },
) {
  await tx.insert(auditEvents).values({
    orgId: ctx.orgId,
    actorUserId: ctx.userId,
    action: e.action,
    entityType: e.entityType,
    entityId: e.entityId,
    before: e.before ?? null,
    after: e.after ?? null,
  });
}

const isoOrNull = (d: Date | null | undefined) => (d ? d.toISOString() : null);
const bandOf = (s: number | null, l: number | null): RiskBand | null =>
  s != null && l != null ? riskCell(s, l)?.band ?? null : null;
const scoreOf = (s: number | null, l: number | null): number | null =>
  s != null && l != null ? riskCell(s, l)?.score ?? null : null;

export interface HazardListItem {
  id: string;
  code: string;
  title: string;
  category: string | null;
  status: string;
  source: string;
  inherentBand: RiskBand | null;
  inherentScore: number | null;
  residualBand: RiskBand | null;
  residualScore: number | null;
  review: ReviewStatus;
  nextReviewAt: string | null;
  owner: string | null;
}

export async function listHazards(orgId: string): Promise<HazardListItem[]> {
  const db = getAdminDb();
  const rows = await db.select().from(hazards).where(eq(hazards.orgId, orgId)).orderBy(desc(hazards.createdAt));
  const now = new Date();
  const names = new Map<string, string>();
  for (const r of rows) {
    if (r.ownerPersonId && !names.has(r.ownerPersonId)) {
      const [p] = await db.select({ name: persons.name }).from(persons).where(eq(persons.id, r.ownerPersonId)).limit(1);
      if (p) names.set(r.ownerPersonId, p.name);
    }
  }
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    title: r.title,
    category: r.category,
    status: r.status,
    source: r.source,
    inherentBand: bandOf(r.severity, r.likelihood),
    inherentScore: scoreOf(r.severity, r.likelihood),
    residualBand: bandOf(r.residualSeverity, r.residualLikelihood),
    residualScore: scoreOf(r.residualSeverity, r.residualLikelihood),
    review: reviewStatus(r.nextReviewAt, now),
    nextReviewAt: isoOrNull(r.nextReviewAt),
    owner: r.ownerPersonId ? names.get(r.ownerPersonId) ?? null : null,
  }));
}

export interface HazardDetail {
  id: string;
  code: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  source: string;
  sourceRef: string | null;
  ownerPersonId: string | null;
  owner: string | null;
  likelihood: number | null;
  severity: number | null;
  mitigations: string | null;
  residualLikelihood: number | null;
  residualSeverity: number | null;
  inherentBand: RiskBand | null;
  residualBand: RiskBand | null;
  reviewIntervalDays: number | null;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  review: ReviewStatus;
}

export async function getHazardDetail(orgId: string, id: string): Promise<HazardDetail | null> {
  const db = getAdminDb();
  const [r] = await db.select().from(hazards).where(and(eq(hazards.orgId, orgId), eq(hazards.id, id))).limit(1);
  if (!r) return null;
  let owner: string | null = null;
  if (r.ownerPersonId) {
    const [p] = await db.select({ name: persons.name }).from(persons).where(eq(persons.id, r.ownerPersonId)).limit(1);
    owner = p?.name ?? null;
  }
  return {
    id: r.id,
    code: r.code,
    title: r.title,
    description: r.description,
    category: r.category,
    status: r.status,
    source: r.source,
    sourceRef: r.sourceRef,
    ownerPersonId: r.ownerPersonId,
    owner,
    likelihood: r.likelihood,
    severity: r.severity,
    mitigations: r.mitigations,
    residualLikelihood: r.residualLikelihood,
    residualSeverity: r.residualSeverity,
    inherentBand: bandOf(r.severity, r.likelihood),
    residualBand: bandOf(r.residualSeverity, r.residualLikelihood),
    reviewIntervalDays: r.reviewIntervalDays,
    lastReviewedAt: isoOrNull(r.lastReviewedAt),
    nextReviewAt: isoOrNull(r.nextReviewAt),
    review: reviewStatus(r.nextReviewAt, new Date()),
  };
}

export interface CreateHazardInput {
  title: string;
  description?: string;
  category?: string;
  source?: "manual" | "recurring_deviation" | "occurrence";
  sourceRef?: string;
}

export async function createHazard(ctx: TenantCtx, input: CreateHazardInput): Promise<string> {
  await requireAnyRole(ctx.orgId, ctx.userId, [...SAFETY_ROLES]);
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [c] = await tx
      .insert(counters)
      .values({ orgId: ctx.orgId, key: "hazard", value: 1 })
      .onConflictDoUpdate({ target: [counters.orgId, counters.key], set: { value: sql`${counters.value} + 1`, updatedAt: new Date() } })
      .returning({ value: counters.value });
    const code = `HAZ-${String(c!.value).padStart(3, "0")}`;
    const [r] = await tx
      .insert(hazards)
      .values({ orgId: ctx.orgId, code, title: input.title, description: input.description, category: input.category, source: input.source ?? "manual", sourceRef: input.sourceRef, status: "open" })
      .returning({ id: hazards.id });
    await audit(tx, ctx, { action: "hazard.create", entityType: "hazard", entityId: r!.id, after: { code, source: input.source ?? "manual" } });
    return r!.id;
  });
}

const intOrNull = (n: number | undefined) => (n == null || !Number.isFinite(n) ? null : n);

export interface UpdateHazardPatch {
  title?: string;
  description?: string;
  category?: string;
  status?: "open" | "monitored" | "closed";
  ownerPersonId?: string | null;
  likelihood?: number;
  severity?: number;
  mitigations?: string;
  residualLikelihood?: number;
  residualSeverity?: number;
  reviewIntervalDays?: number;
}

export async function updateHazard(ctx: TenantCtx, id: string, patch: UpdateHazardPatch) {
  await requireAnyRole(ctx.orgId, ctx.userId, [...SAFETY_ROLES]);
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [r] = await tx.select().from(hazards).where(and(eq(hazards.orgId, ctx.orgId), eq(hazards.id, id))).limit(1);
    if (!r) throw new Error("hazard not found");
    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (patch.title !== undefined) set.title = patch.title;
    if (patch.description !== undefined) set.description = patch.description || null;
    if (patch.category !== undefined) set.category = patch.category || null;
    if (patch.status !== undefined) set.status = patch.status;
    if (patch.ownerPersonId !== undefined) set.ownerPersonId = patch.ownerPersonId;
    if (patch.likelihood !== undefined) set.likelihood = intOrNull(patch.likelihood);
    if (patch.severity !== undefined) set.severity = intOrNull(patch.severity);
    if (patch.mitigations !== undefined) set.mitigations = patch.mitigations || null;
    if (patch.residualLikelihood !== undefined) set.residualLikelihood = intOrNull(patch.residualLikelihood);
    if (patch.residualSeverity !== undefined) set.residualSeverity = intOrNull(patch.residualSeverity);
    if (patch.reviewIntervalDays !== undefined) set.reviewIntervalDays = intOrNull(patch.reviewIntervalDays);
    await tx.update(hazards).set(set).where(eq(hazards.id, id));
    await audit(tx, ctx, { action: "hazard.update", entityType: "hazard", entityId: id });
  });
}

/** Mark the hazard reviewed now and schedule the next review from its interval. */
export async function reviewHazard(ctx: TenantCtx, id: string) {
  await requireAnyRole(ctx.orgId, ctx.userId, [...SAFETY_ROLES]);
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [r] = await tx.select().from(hazards).where(and(eq(hazards.orgId, ctx.orgId), eq(hazards.id, id))).limit(1);
    if (!r) throw new Error("hazard not found");
    const now = new Date();
    const next = r.reviewIntervalDays ? new Date(now.getTime() + r.reviewIntervalDays * 86_400_000) : null;
    await tx.update(hazards).set({ lastReviewedAt: now, nextReviewAt: next, updatedAt: now }).where(eq(hazards.id, id));
    await audit(tx, ctx, { action: "hazard.review", entityType: "hazard", entityId: id, after: { nextReviewAt: isoOrNull(next) } });
  });
}

export interface RecurringDeviation {
  deviationCode: string;
  count: number;
  linkedHazardCode: string | null;
}

/**
 * Recurring flight-deviation types — the deviation→risk connection. Counts
 * deviation-sourced findings by code (threshold ≥3 = recurring) and reports
 * whether the register already carries a hazard for that code.
 */
export async function recurringDeviations(orgId: string, threshold = 3): Promise<RecurringDeviation[]> {
  const db = getAdminDb();
  const grouped = await db
    .select({ code: findings.deviationCode, count: sql<number>`count(*)::int` })
    .from(findings)
    .where(and(eq(findings.orgId, orgId), eq(findings.source, "flight_deviation"), isNotNull(findings.deviationCode)))
    .groupBy(findings.deviationCode);

  // Register entries already opened for a deviation code (for display + dedupe).
  const linkedRows = await db
    .select({ code: hazards.code, ref: hazards.sourceRef })
    .from(hazards)
    .where(and(eq(hazards.orgId, orgId), eq(hazards.source, "recurring_deviation"), isNotNull(hazards.sourceRef)));
  const linkedCodes = new Map<string, string>();
  for (const l of linkedRows) if (l.ref) linkedCodes.set(l.ref, l.code);

  return grouped
    .filter((g) => g.code != null && g.count >= threshold)
    .map((g) => ({ deviationCode: g.code as string, count: g.count, linkedHazardCode: linkedCodes.get(g.code as string) ?? null }))
    .sort((a, b) => b.count - a.count);
}

/** Open a register entry from a recurring deviation code (idempotent on the code). */
export async function createHazardFromDeviation(ctx: TenantCtx, deviationCode: string): Promise<string> {
  await requireAnyRole(ctx.orgId, ctx.userId, [...SAFETY_ROLES]);
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [existing] = await tx
      .select({ id: hazards.id })
      .from(hazards)
      .where(and(eq(hazards.orgId, ctx.orgId), eq(hazards.source, "recurring_deviation"), eq(hazards.sourceRef, deviationCode)))
      .limit(1);
    if (existing) return existing.id;

    const [c] = await tx
      .insert(counters)
      .values({ orgId: ctx.orgId, key: "hazard", value: 1 })
      .onConflictDoUpdate({ target: [counters.orgId, counters.key], set: { value: sql`${counters.value} + 1`, updatedAt: new Date() } })
      .returning({ value: counters.value });
    const code = `HAZ-${String(c!.value).padStart(3, "0")}`;
    const pretty = deviationCode.replace(/_/g, " ");
    const [r] = await tx
      .insert(hazards)
      .values({ orgId: ctx.orgId, code, title: `Recurring deviation: ${pretty}`, source: "recurring_deviation", sourceRef: deviationCode, category: "operational", status: "open" })
      .returning({ id: hazards.id });
    await audit(tx, ctx, { action: "hazard.from_deviation", entityType: "hazard", entityId: r!.id, after: { code, deviationCode } });
    return r!.id;
  });
}
