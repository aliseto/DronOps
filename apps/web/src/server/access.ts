import "server-only";
import { and, eq } from "drizzle-orm";
import { getAdminDb, withTenant, type TenantCtx, type Tx } from "@dronops/db";
import { auditEvents, memberships, personRoles, persons, userPersons } from "@dronops/db/schema";
import { isDomainRole, type DomainRole } from "@dronops/shared";
import { requireOrgAdmin } from "./rbac";

/**
 * Access management: the bridge between platform access (memberships) and
 * operational identity + domain RBAC (persons / user_persons / person_roles).
 * Without this, a new org's members have no person or roles and the whole app
 * reads empty. All mutations are gated on membership owner/admin (NOT domain
 * roles) so the founding owner can bootstrap.
 */

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

export interface AccessRow {
  membershipId: string;
  email: string;
  membershipRole: string; // owner | admin | member
  status: string; // active | invited
  userId: string | null;
  personId: string | null;
  personName: string | null;
  roles: string[]; // domain roles on the linked person
}

/** Every member with their linked person (if any) and granted domain roles. */
export async function listAccess(orgId: string): Promise<AccessRow[]> {
  const db = getAdminDb();
  const [mems, links, people, roleRows] = await Promise.all([
    db.select().from(memberships).where(eq(memberships.orgId, orgId)),
    db.select().from(userPersons).where(eq(userPersons.orgId, orgId)),
    db.select().from(persons).where(eq(persons.orgId, orgId)),
    db.select().from(personRoles).where(eq(personRoles.orgId, orgId)),
  ]);
  const personById = new Map(people.map((p) => [p.id, p]));
  const personByUser = new Map(links.map((l) => [l.userId, l.personId]));
  const rolesByPerson = new Map<string, string[]>();
  for (const r of roleRows) {
    const list = rolesByPerson.get(r.personId) ?? [];
    list.push(r.role);
    rolesByPerson.set(r.personId, list);
  }
  return mems
    .map((m) => {
      const personId = m.userId ? (personByUser.get(m.userId) ?? null) : null;
      return {
        membershipId: m.id,
        email: m.email,
        membershipRole: m.role,
        status: m.status,
        userId: m.userId ?? null,
        personId,
        personName: personId ? (personById.get(personId)?.name ?? null) : null,
        roles: personId ? (rolesByPerson.get(personId) ?? []) : [],
      };
    })
    .sort((a, b) => a.email.localeCompare(b.email));
}

/** Create an operational person for an accepted member and link their login.
 * Idempotent: returns the existing linked person if there is one. */
export async function ensurePersonForMember(
  ctx: TenantCtx,
  input: { userId: string; name: string; email?: string },
): Promise<string> {
  await requireOrgAdmin(ctx.orgId, ctx.userId);
  if (!input.name.trim()) throw new Error("A name is required");
  return withTenant(getAdminDb(), ctx, async (tx) => {
    const [existing] = await tx
      .select({ personId: userPersons.personId })
      .from(userPersons)
      .where(and(eq(userPersons.orgId, ctx.orgId), eq(userPersons.userId, input.userId)))
      .limit(1);
    if (existing) return existing.personId;

    const [p] = await tx
      .insert(persons)
      .values({ orgId: ctx.orgId, name: input.name.trim(), email: input.email })
      .returning();
    if (!p) throw new Error("person insert failed");
    await tx.insert(userPersons).values({ orgId: ctx.orgId, userId: input.userId, personId: p.id });
    await audit(tx, ctx, {
      action: "person.create",
      entityType: "person",
      entityId: p.id,
      after: { name: input.name, linkedUser: input.userId },
    });
    return p.id;
  });
}

export async function grantRole(ctx: TenantCtx, personId: string, role: string) {
  await requireOrgAdmin(ctx.orgId, ctx.userId);
  if (!isDomainRole(role)) throw new Error(`Unknown role: ${role}`);
  return withTenant(getAdminDb(), ctx, async (tx) => {
    await tx
      .insert(personRoles)
      .values({ orgId: ctx.orgId, personId, role: role as DomainRole, grantedBy: ctx.userId })
      .onConflictDoNothing();
    await audit(tx, ctx, { action: "person_role.grant", entityType: "person", entityId: personId, after: { role } });
  });
}

export async function revokeRole(ctx: TenantCtx, personId: string, role: string) {
  await requireOrgAdmin(ctx.orgId, ctx.userId);
  if (!isDomainRole(role)) throw new Error(`Unknown role: ${role}`);
  return withTenant(getAdminDb(), ctx, async (tx) => {
    await tx
      .delete(personRoles)
      .where(
        and(
          eq(personRoles.orgId, ctx.orgId),
          eq(personRoles.personId, personId),
          eq(personRoles.role, role),
        ),
      );
    await audit(tx, ctx, { action: "person_role.revoke", entityType: "person", entityId: personId, before: { role } });
  });
}
