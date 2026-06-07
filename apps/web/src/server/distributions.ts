import "server-only";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { getAdminDb, withTenant, type TenantCtx, type Tx } from "@dronops/db";
import {
  auditEvents,
  documentAcks,
  documentDistributions,
  documentRevisions,
  documents,
  personRoles,
  persons,
} from "@dronops/db/schema";
import { DOMAIN_ROLE_LABELS, isDomainRole } from "@dronops/shared";
import { getCurrentPersonId, getPersonRoles } from "./rbac";

async function audit(tx: Tx, ctx: TenantCtx, e: { action: string; entityId?: string; after?: unknown }) {
  await tx.insert(auditEvents).values({
    orgId: ctx.orgId,
    actorUserId: ctx.userId,
    action: e.action,
    entityType: "document",
    entityId: e.entityId,
    after: e.after ?? null,
    amr: "password",
  });
}

export interface DistributeInput {
  audienceType: "role" | "person";
  audienceRef: string;
  ackRequired: boolean;
  dueAt?: Date;
}

export async function distributeRevision(ctx: TenantCtx, revisionId: string, input: DistributeInput) {
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [dist] = await tx
      .insert(documentDistributions)
      .values({
        orgId: ctx.orgId,
        revisionId,
        audienceType: input.audienceType,
        audienceRef: input.audienceRef,
        ackRequired: input.ackRequired,
        dueAt: input.dueAt,
        createdBy: ctx.userId,
      })
      .returning();
    if (!dist) throw new Error("distribution insert failed");
    await audit(tx, ctx, {
      action: "document.distribute",
      entityId: revisionId,
      after: { audienceType: input.audienceType, audienceRef: input.audienceRef },
    });
    return dist;
  });
}

export async function acknowledgeDistribution(ctx: TenantCtx, distributionId: string) {
  const personId = await getCurrentPersonId(ctx.orgId, ctx.userId);
  if (!personId) throw new Error("No person record to acknowledge as");
  return withTenant(getAdminDb(), ctx, async (tx) => {
    await tx
      .insert(documentAcks)
      .values({ orgId: ctx.orgId, distributionId, personId })
      .onConflictDoNothing({ target: [documentAcks.orgId, documentAcks.distributionId, documentAcks.personId] });
    await audit(tx, ctx, { action: "document.ack", entityId: distributionId });
  });
}

export interface DistributionProgress {
  id: string;
  audienceType: "role" | "person";
  audienceLabel: string;
  ackRequired: boolean;
  dueAt: Date | null;
  total: number;
  acked: number;
  overdue: boolean;
  mine: boolean;
  ackedByMe: boolean;
}

export async function listDistributionsForRevision(
  orgId: string,
  revisionId: string,
  viewer?: { personId: string; roles: string[] },
): Promise<DistributionProgress[]> {
  const db = getAdminDb();
  const dists = await db
    .select()
    .from(documentDistributions)
    .where(and(eq(documentDistributions.orgId, orgId), eq(documentDistributions.revisionId, revisionId)));

  const out: DistributionProgress[] = [];
  for (const d of dists) {
    let total = 1;
    let audienceLabel = d.audienceRef;
    if (d.audienceType === "role") {
      audienceLabel = isDomainRole(d.audienceRef)
        ? DOMAIN_ROLE_LABELS[d.audienceRef]
        : d.audienceRef;
      const [c] = await db
        .select({ n: sql<number>`count(*)` })
        .from(personRoles)
        .where(and(eq(personRoles.orgId, orgId), eq(personRoles.role, d.audienceRef)));
      total = Number(c?.n ?? 0);
    } else {
      const [p] = await db
        .select({ name: persons.name })
        .from(persons)
        .where(and(eq(persons.orgId, orgId), eq(persons.id, d.audienceRef)))
        .limit(1);
      audienceLabel = p?.name ?? "Person";
    }
    const [a] = await db
      .select({ n: sql<number>`count(*)` })
      .from(documentAcks)
      .where(and(eq(documentAcks.orgId, orgId), eq(documentAcks.distributionId, d.id)));
    const acked = Number(a?.n ?? 0);
    const overdue =
      d.ackRequired && d.dueAt != null && d.dueAt.getTime() < Date.now() && acked < total;

    let mine = false;
    let ackedByMe = false;
    if (viewer) {
      mine =
        d.audienceType === "person"
          ? d.audienceRef === viewer.personId
          : viewer.roles.includes(d.audienceRef);
      if (mine) {
        const [m] = await db
          .select({ id: documentAcks.id })
          .from(documentAcks)
          .where(
            and(
              eq(documentAcks.orgId, orgId),
              eq(documentAcks.distributionId, d.id),
              eq(documentAcks.personId, viewer.personId),
            ),
          )
          .limit(1);
        ackedByMe = !!m;
      }
    }

    out.push({
      id: d.id,
      audienceType: d.audienceType,
      audienceLabel,
      ackRequired: d.ackRequired,
      dueAt: d.dueAt,
      total,
      acked,
      overdue,
      mine,
      ackedByMe,
    });
  }
  return out;
}

export async function listPersons(orgId: string): Promise<{ id: string; name: string }[]> {
  return getAdminDb()
    .select({ id: persons.id, name: persons.name })
    .from(persons)
    .where(eq(persons.orgId, orgId));
}

export interface AckDue {
  distributionId: string;
  docNo: string;
  title: string;
  revNo: number;
  dueAt: Date | null;
  overdue: boolean;
}

/** A person's outstanding acknowledgements — personal obligations (UX §1.3). */
export async function myAcksDue(orgId: string, personId: string): Promise<AckDue[]> {
  const roles = await getPersonRoles(orgId, personId);
  const db = getAdminDb();

  const audienceCond =
    roles.length > 0
      ? or(
          and(
            eq(documentDistributions.audienceType, "person"),
            eq(documentDistributions.audienceRef, personId),
          ),
          and(
            eq(documentDistributions.audienceType, "role"),
            inArray(documentDistributions.audienceRef, roles),
          ),
        )
      : and(
          eq(documentDistributions.audienceType, "person"),
          eq(documentDistributions.audienceRef, personId),
        );

  const rows = await db
    .select({
      distributionId: documentDistributions.id,
      dueAt: documentDistributions.dueAt,
      docNo: documents.docNo,
      title: documents.title,
      revNo: documentRevisions.revNo,
      ackId: documentAcks.id,
    })
    .from(documentDistributions)
    .innerJoin(documentRevisions, eq(documentDistributions.revisionId, documentRevisions.id))
    .innerJoin(documents, eq(documentRevisions.documentId, documents.id))
    .leftJoin(
      documentAcks,
      and(
        eq(documentAcks.distributionId, documentDistributions.id),
        eq(documentAcks.personId, personId),
      ),
    )
    .where(
      and(
        eq(documentDistributions.orgId, orgId),
        eq(documentDistributions.ackRequired, true),
        isNull(documentAcks.id),
        audienceCond,
      ),
    );

  return rows.map((r) => ({
    distributionId: r.distributionId,
    docNo: r.docNo,
    title: r.title,
    revNo: r.revNo,
    dueAt: r.dueAt,
    overdue: r.dueAt != null && r.dueAt.getTime() < Date.now(),
  }));
}
