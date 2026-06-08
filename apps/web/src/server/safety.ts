import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getAdminDb, withTenant, type TenantCtx, type Tx } from "@dronops/db";
import { aircraft, auditEvents, counters, findings, missions, occurrences, persons } from "@dronops/db/schema";
import {
  capaDueDate,
  deadlineFor,
  occurrenceDeadlineStatus,
  type Jurisdiction,
  type OccurrenceClass,
  type OccurrenceDeadlineStatus,
} from "@dronops/shared";
import { requireAnyRole, getCurrentPersonId } from "./rbac";

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

/** Serialize the live deadline status (Dates → ISO) for client views. */
export interface DeadlineStatusDTO {
  applicable: boolean;
  immediate: boolean;
  contacts: string | null;
  clause: string | null;
  appliesTo: string | null;
  dueAt: string | null;
  satisfied: boolean;
  overdue: boolean;
  remainingMs: number | null;
  listed: { dueAt: string; clause: string } | null;
}

function toDTO(s: OccurrenceDeadlineStatus): DeadlineStatusDTO {
  return {
    applicable: s.applicable,
    immediate: s.immediate,
    contacts: s.contacts,
    clause: s.clause,
    appliesTo: s.appliesTo,
    dueAt: isoOrNull(s.dueAt),
    satisfied: s.satisfied,
    overdue: s.overdue,
    remainingMs: s.remainingMs,
    listed: s.listed ? { dueAt: s.listed.dueAt.toISOString(), clause: s.listed.clause } : null,
  };
}

function statusFor(row: typeof occurrences.$inferSelect, now: Date): DeadlineStatusDTO {
  return toDTO(
    occurrenceDeadlineStatus(
      { classification: row.classification, occurredAt: row.occurredAt, reportedToRegulatorAt: row.reportedToRegulatorAt },
      row.jurisdiction as Jurisdiction,
      now,
    ),
  );
}

export interface OccurrenceListItem {
  id: string;
  code: string;
  classification: OccurrenceClass;
  title: string;
  jurisdiction: string;
  status: string;
  occurredAt: string;
  reportedAt: string;
  escalated: boolean;
  deadline: DeadlineStatusDTO;
}

export async function listOccurrences(orgId: string): Promise<OccurrenceListItem[]> {
  const rows = await getAdminDb().select().from(occurrences).where(eq(occurrences.orgId, orgId)).orderBy(desc(occurrences.occurredAt));
  const now = new Date();
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    classification: r.classification,
    title: r.title,
    jurisdiction: r.jurisdiction,
    status: r.status,
    occurredAt: r.occurredAt.toISOString(),
    reportedAt: r.reportedAt.toISOString(),
    escalated: r.escalatedFindingId != null,
    deadline: statusFor(r, now),
  }));
}

export interface OccurrenceDetail {
  id: string;
  code: string;
  classification: OccurrenceClass;
  title: string;
  description: string | null;
  jurisdiction: string;
  status: string;
  occurredAt: string;
  reportedAt: string;
  reportedBy: string | null;
  reportedToRegulatorAt: string | null;
  investigationSummary: string | null;
  rootCause: string | null;
  closedAt: string | null;
  closedBy: string | null;
  // Resolved auto-links.
  missionCode: string | null;
  missionId: string | null;
  aircraftLabel: string | null;
  flightRecordId: string | null;
  pilotName: string | null;
  // Escalation.
  escalatedFindingId: string | null;
  escalatedFindingCode: string | null;
  escalatedAt: string | null;
  deadline: DeadlineStatusDTO;
}

export async function getOccurrenceDetail(orgId: string, id: string): Promise<OccurrenceDetail | null> {
  const db = getAdminDb();
  const [r] = await db.select().from(occurrences).where(and(eq(occurrences.orgId, orgId), eq(occurrences.id, id))).limit(1);
  if (!r) return null;

  const name = async (pid: string | null) =>
    pid ? (await db.select({ name: persons.name }).from(persons).where(eq(persons.id, pid)).limit(1))[0]?.name ?? null : null;

  const [reportedBy, closedBy, pilotName] = await Promise.all([name(r.reportedByPersonId), name(r.closedByPersonId), name(r.pilotPersonId)]);

  let missionCode: string | null = null;
  if (r.missionId) {
    const [m] = await db.select({ code: missions.code }).from(missions).where(eq(missions.id, r.missionId)).limit(1);
    missionCode = m?.code ?? null;
  }
  let aircraftLabel: string | null = null;
  if (r.aircraftId) {
    const [a] = await db.select({ label: aircraft.label }).from(aircraft).where(eq(aircraft.id, r.aircraftId)).limit(1);
    aircraftLabel = a?.label ?? null;
  }
  let escalatedFindingCode: string | null = null;
  if (r.escalatedFindingId) {
    const [f] = await db.select({ code: findings.code }).from(findings).where(eq(findings.id, r.escalatedFindingId)).limit(1);
    escalatedFindingCode = f?.code ?? null;
  }

  return {
    id: r.id,
    code: r.code,
    classification: r.classification,
    title: r.title,
    description: r.description,
    jurisdiction: r.jurisdiction,
    status: r.status,
    occurredAt: r.occurredAt.toISOString(),
    reportedAt: r.reportedAt.toISOString(),
    reportedBy,
    reportedToRegulatorAt: isoOrNull(r.reportedToRegulatorAt),
    investigationSummary: r.investigationSummary,
    rootCause: r.rootCause,
    closedAt: isoOrNull(r.closedAt),
    closedBy,
    missionCode,
    missionId: r.missionId,
    aircraftLabel,
    flightRecordId: r.flightRecordId,
    pilotName,
    escalatedFindingId: r.escalatedFindingId,
    escalatedFindingCode,
    escalatedAt: isoOrNull(r.escalatedAt),
    deadline: statusFor(r, new Date()),
  };
}

export interface CreateOccurrenceInput {
  classification: OccurrenceClass;
  title: string;
  description?: string;
  jurisdiction: string;
  occurredAt: Date;
  missionId?: string;
  flightRecordId?: string;
  aircraftId?: string;
  pilotPersonId?: string;
}

/**
 * File an occurrence (S-01) — open to ANY member; no role gate. Computes the
 * jurisdiction reporting deadline at filing and preserves the field-capture
 * timestamp. Mission-context links are passed through when filed from a mission.
 */
export async function createOccurrence(ctx: TenantCtx, input: CreateOccurrenceInput): Promise<string> {
  const reportedByPersonId = await getCurrentPersonId(ctx.orgId, ctx.userId);
  // Only incidents/accidents carry a regulator clock.
  const dl = input.classification === "hazard_observation" ? null : deadlineFor({ occurredAt: input.occurredAt }, input.jurisdiction as Jurisdiction);
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [c] = await tx
      .insert(counters)
      .values({ orgId: ctx.orgId, key: "occurrence", value: 1 })
      .onConflictDoUpdate({ target: [counters.orgId, counters.key], set: { value: sql`${counters.value} + 1`, updatedAt: new Date() } })
      .returning({ value: counters.value });
    const code = `OCC-${String(c!.value).padStart(3, "0")}`;
    const [r] = await tx
      .insert(occurrences)
      .values({
        orgId: ctx.orgId,
        code,
        classification: input.classification,
        title: input.title,
        description: input.description,
        jurisdiction: input.jurisdiction,
        occurredAt: input.occurredAt,
        reportedByPersonId,
        missionId: input.missionId,
        flightRecordId: input.flightRecordId,
        aircraftId: input.aircraftId,
        pilotPersonId: input.pilotPersonId,
        reportingDueAt: dl?.dueAt,
        reportingClause: dl?.rule.clause,
        status: "open",
      })
      .returning({ id: occurrences.id });
    await audit(tx, ctx, { action: "occurrence.file", entityType: "occurrence", entityId: r!.id, after: { code, classification: input.classification } });
    return r!.id;
  });
}

const SAFETY_ROLES = ["quality_manager", "ops_manager", "accountable_manager"] as const;

/** Edit investigation fields on a non-closed occurrence (S-05). Role-gated (SoD). */
export async function updateOccurrence(ctx: TenantCtx, id: string, patch: { investigationSummary?: string; rootCause?: string; description?: string }) {
  await requireAnyRole(ctx.orgId, ctx.userId, [...SAFETY_ROLES]);
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [r] = await tx.select().from(occurrences).where(and(eq(occurrences.orgId, ctx.orgId), eq(occurrences.id, id))).limit(1);
    if (!r) throw new Error("occurrence not found");
    if (r.status === "closed") throw new Error("a closed occurrence is immutable");
    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (patch.investigationSummary !== undefined) set.investigationSummary = patch.investigationSummary || null;
    if (patch.rootCause !== undefined) set.rootCause = patch.rootCause || null;
    if (patch.description !== undefined) set.description = patch.description || null;
    await tx.update(occurrences).set(set).where(eq(occurrences.id, id));
    await audit(tx, ctx, { action: "occurrence.update", entityType: "occurrence", entityId: id });
  });
}

/** Record the regulator notification — satisfies the reporting clock. Role-gated. */
export async function markReportedToRegulator(ctx: TenantCtx, id: string, at?: Date) {
  await requireAnyRole(ctx.orgId, ctx.userId, [...SAFETY_ROLES]);
  const when = at ?? new Date();
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [r] = await tx.select().from(occurrences).where(and(eq(occurrences.orgId, ctx.orgId), eq(occurrences.id, id))).limit(1);
    if (!r) throw new Error("occurrence not found");
    if (r.status === "closed") throw new Error("a closed occurrence is immutable");
    await tx.update(occurrences).set({ reportedToRegulatorAt: when, updatedAt: new Date() }).where(eq(occurrences.id, id));
    await audit(tx, ctx, { action: "occurrence.report_to_regulator", entityType: "occurrence", entityId: id, after: { at: when.toISOString() } });
  });
}

const FLOW: Record<string, string[]> = { open: ["investigating"], investigating: ["open", "closed"], closed: [] };

/** Advance the investigation lifecycle. Closing seals the record (immutable). Role-gated. */
export async function transitionOccurrence(ctx: TenantCtx, id: string, to: "open" | "investigating" | "closed") {
  await requireAnyRole(ctx.orgId, ctx.userId, [...SAFETY_ROLES]);
  const closerPersonId = await getCurrentPersonId(ctx.orgId, ctx.userId);
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [r] = await tx.select().from(occurrences).where(and(eq(occurrences.orgId, ctx.orgId), eq(occurrences.id, id))).limit(1);
    if (!r) throw new Error("occurrence not found");
    if (!(FLOW[r.status] ?? []).includes(to)) throw new Error(`cannot move occurrence from ${r.status} to ${to}`);
    const set: Record<string, unknown> = { status: to, updatedAt: new Date() };
    if (to === "closed") {
      set.closedAt = new Date();
      set.closedByPersonId = closerPersonId;
    }
    await tx.update(occurrences).set(set).where(eq(occurrences.id, id));
    await audit(tx, ctx, { action: `occurrence.${to === "closed" ? "close" : "transition"}`, entityType: "occurrence", entityId: id, after: { status: to } });
  });
}

/**
 * Escalate a systemic occurrence to an M2 finding (S-05) — mirrors
 * raiseFindingFromGap: idempotent, content-driven CAPA deadline, two-way link.
 * Role-gated to quality/accountable manager (finding ownership, as in M2).
 */
export async function escalateToFinding(ctx: TenantCtx, id: string, level: "major" | "minor" | "observation" = "minor"): Promise<string> {
  await requireAnyRole(ctx.orgId, ctx.userId, ["quality_manager", "accountable_manager"]);
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [r] = await tx.select().from(occurrences).where(and(eq(occurrences.orgId, ctx.orgId), eq(occurrences.id, id))).limit(1);
    if (!r) throw new Error("occurrence not found");
    if (r.escalatedFindingId) {
      const [f] = await tx.select({ code: findings.code }).from(findings).where(eq(findings.id, r.escalatedFindingId)).limit(1);
      return f?.code ?? "";
    }

    const [c] = await tx
      .insert(counters)
      .values({ orgId: ctx.orgId, key: "finding", value: 1 })
      .onConflictDoUpdate({ target: [counters.orgId, counters.key], set: { value: sql`${counters.value} + 1`, updatedAt: new Date() } })
      .returning({ value: counters.value });
    const code = `NCR-${String(c!.value).padStart(3, "0")}`;
    const [f] = await tx
      .insert(findings)
      .values({
        orgId: ctx.orgId,
        code,
        jurisdiction: r.jurisdiction,
        source: "occurrence",
        sourceRef: r.id,
        level,
        status: "open",
        title: `Occurrence ${r.code}: ${r.title}`,
        description: r.rootCause ?? r.investigationSummary ?? r.description,
        dueAt: capaDueDate(r.jurisdiction as Jurisdiction, level, new Date()),
      })
      .returning({ id: findings.id });

    await tx.update(occurrences).set({ escalatedFindingId: f!.id, escalatedAt: new Date(), updatedAt: new Date() }).where(eq(occurrences.id, id));
    await audit(tx, ctx, { action: "occurrence.escalate_to_finding", entityType: "occurrence", entityId: id, after: { findingCode: code, level } });
    return code;
  });
}
