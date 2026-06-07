import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getAdminDb, withTenant, type TenantCtx, type Tx } from "@dronops/db";
import { auditEvents, capaActions, findings, persons } from "@dronops/db/schema";
import {
  applyTriage,
  findingTransition,
  allowedFindingTransitions,
  type FindingStatus,
  type TriageDecision,
} from "@dronops/shared";

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
    amr: "password",
  });
}

const isoOrNull = (d: Date | null | undefined) => (d ? d.toISOString() : null);

export interface FindingListItem {
  id: string;
  code: string;
  title: string;
  jurisdiction: string | null;
  source: string;
  deviationCode: string | null;
  level: string;
  severity: string | null;
  status: string;
  dueAt: string | null;
  triagedAt: string | null;
  untriaged: boolean;
}

export async function listFindings(orgId: string): Promise<FindingListItem[]> {
  const rows = await getAdminDb().select().from(findings).where(eq(findings.orgId, orgId)).orderBy(desc(findings.createdAt));
  return rows.map((f) => ({
    id: f.id,
    code: f.code,
    title: f.title,
    jurisdiction: f.jurisdiction,
    source: f.source,
    deviationCode: f.deviationCode,
    level: f.level,
    severity: f.severity,
    status: f.status,
    dueAt: isoOrNull(f.dueAt),
    triagedAt: isoOrNull(f.triagedAt),
    // Auto-raised + not yet triaged → it's in the triage queue.
    untriaged: f.source === "flight_deviation" && f.triagedAt == null && f.status === "open",
  }));
}

export interface FindingDetail {
  finding: FindingListItem & {
    description: string | null;
    sourceRef: string | null;
    evidenceFileId: string | null;
    raisedBy: string | null;
    verifiedBy: string | null;
    closedAt: string | null;
    triageReason: string | null;
  };
  capa: { id: string; kind: string; description: string; owner: string | null; dueAt: string | null; completedAt: string | null }[];
  transitions: { to: string; label: string; verifies?: boolean }[];
}

export async function getFindingDetail(orgId: string, id: string): Promise<FindingDetail | null> {
  const db = getAdminDb();
  const [f] = await db.select().from(findings).where(and(eq(findings.orgId, orgId), eq(findings.id, id))).limit(1);
  if (!f) return null;
  const capa = await db.select().from(capaActions).where(and(eq(capaActions.orgId, orgId), eq(capaActions.findingId, id))).orderBy(desc(capaActions.createdAt));
  const personIds = [f.raisedByPersonId, f.verifiedByPersonId, ...capa.map((c) => c.ownerPersonId)].filter((x): x is string => x != null);
  const people = personIds.length ? await db.select({ id: persons.id, name: persons.name }).from(persons).where(eq(persons.orgId, orgId)) : [];
  const nameOf = (pid: string | null) => (pid ? people.find((p) => p.id === pid)?.name ?? null : null);
  return {
    finding: {
      id: f.id,
      code: f.code,
      title: f.title,
      jurisdiction: f.jurisdiction,
      source: f.source,
      deviationCode: f.deviationCode,
      level: f.level,
      severity: f.severity,
      status: f.status,
      dueAt: isoOrNull(f.dueAt),
      triagedAt: isoOrNull(f.triagedAt),
      untriaged: f.source === "flight_deviation" && f.triagedAt == null && f.status === "open",
      description: f.description,
      sourceRef: f.sourceRef,
      evidenceFileId: f.evidenceFileId,
      raisedBy: nameOf(f.raisedByPersonId),
      verifiedBy: nameOf(f.verifiedByPersonId),
      closedAt: isoOrNull(f.closedAt),
      triageReason: f.triageReason,
    },
    capa: capa.map((c) => ({ id: c.id, kind: c.kind, description: c.description, owner: nameOf(c.ownerPersonId), dueAt: isoOrNull(c.dueAt), completedAt: isoOrNull(c.completedAt) })),
    transitions: allowedFindingTransitions(f.status as FindingStatus).map((t) => ({ to: t.to, label: t.label, verifies: t.verifies })),
  };
}

/**
 * Triage an auto-raised finding (C-04). A reason is REQUIRED for the two
 * signal-weakening outcomes (downgrade, false-positive) and optional for accept
 * (the system already judged it); the reason is written to the audit trail in
 * all cases. false-positive is terminal + immutable (enforce_finding_terminal).
 */
export async function triageFinding(ctx: TenantCtx, id: string, decision: TriageDecision, reason: string) {
  const trimmed = reason.trim();
  if ((decision === "downgrade" || decision === "false-positive") && !trimmed) {
    throw new Error("A reason is required to downgrade or dismiss a finding");
  }
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [f] = await tx.select().from(findings).where(and(eq(findings.orgId, ctx.orgId), eq(findings.id, id))).limit(1);
    if (!f) throw new Error("finding not found");
    if (f.triagedAt) throw new Error("finding already triaged");
    const patch = applyTriage(decision, f.level as "major" | "minor" | "observation");
    await tx
      .update(findings)
      .set({ level: patch.level, status: patch.status ?? f.status, triagedAt: new Date(), triageDecision: decision, triageReason: trimmed || null, updatedAt: new Date() })
      .where(eq(findings.id, id));
    await audit(tx, ctx, { action: "finding.triage", entityType: "finding", entityId: id, before: { level: f.level, status: f.status }, after: { decision, level: patch.level, reason: trimmed || null } });
  });
}

/**
 * Lifecycle transition. Closure (verify→closed) sets the verifier — the
 * enforce_finding_sod trigger rejects the raiser verifying their own finding.
 */
export async function transitionFinding(ctx: TenantCtx, id: string, to: FindingStatus, verifierPersonId?: string) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [f] = await tx.select().from(findings).where(and(eq(findings.orgId, ctx.orgId), eq(findings.id, id))).limit(1);
    if (!f) throw new Error("finding not found");
    const t = findingTransition(f.status as FindingStatus, to);
    if (!t) throw new Error(`Not a valid transition: ${f.status} → ${to}`);
    const patch: Partial<typeof findings.$inferInsert> = { status: to, updatedAt: new Date() };
    if (t.verifies) {
      if (!verifierPersonId) throw new Error("A verifier is required to close");
      patch.verifiedByPersonId = verifierPersonId;
      patch.closedAt = new Date();
    }
    await tx.update(findings).set(patch).where(eq(findings.id, id));
    await audit(tx, ctx, { action: "finding.transition", entityType: "finding", entityId: id, before: { status: f.status }, after: { status: to } });
  });
}

export async function addCapaAction(
  ctx: TenantCtx,
  input: { findingId: string; kind: "containment" | "corrective" | "preventive"; description: string; ownerPersonId?: string; dueAt?: Date },
) {
  if (!input.description.trim()) throw new Error("A description is required");
  return withTenant(getAdminDb(), ctx, async (tx) => {
    await tx.insert(capaActions).values({
      orgId: ctx.orgId,
      findingId: input.findingId,
      kind: input.kind,
      description: input.description.trim(),
      ownerPersonId: input.ownerPersonId,
      dueAt: input.dueAt,
    });
    await audit(tx, ctx, { action: "capa_action.add", entityType: "finding", entityId: input.findingId, after: { kind: input.kind } });
  });
}
