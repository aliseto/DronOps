import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { getAdminDb, mutate } from "@dronops/db";
import { memberships, organizations, orgJurisdictions } from "@dronops/db/schema";
import { isJurisdictionKey } from "@dronops/content";

// Onboarding is an owner bootstrap (the user has no org yet), so it runs on the
// admin client — but every write still goes through mutate() for the audit row.
// Request-path domain features (later milestones) use the app_user path.

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return `${base || "org"}-${Math.random().toString(36).slice(2, 7)}`;
}

export interface OrgActor {
  userId: string;
  email: string;
}

type Organization = typeof organizations.$inferSelect;

export async function createOrganization(actor: OrgActor, name: string): Promise<Organization> {
  const db = getAdminDb();
  const id = crypto.randomUUID();
  return mutate<Organization>(
    db,
    { orgId: id, userId: actor.userId },
    (org) => ({
      action: "organization.create",
      entityType: "organization",
      entityId: id,
      after: org,
      amr: "password",
    }),
    async (tx) => {
      const [org] = await tx
        .insert(organizations)
        .values({ id, name, slug: slugify(name), createdBy: actor.userId })
        .returning();
      if (!org) throw new Error("Failed to create organization");
      await tx.insert(memberships).values({
        orgId: id,
        userId: actor.userId,
        email: actor.email,
        role: "owner",
        status: "active",
      });
      return org;
    },
  );
}

/** Orgs the user belongs to (identity-level query, across tenants). */
export async function listUserOrganizations(userId: string) {
  const db = getAdminDb();
  return db
    .select({
      orgId: memberships.orgId,
      role: memberships.role,
      name: organizations.name,
      slug: organizations.slug,
    })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.orgId, organizations.id))
    .where(and(eq(memberships.userId, userId), eq(memberships.status, "active")));
}

export async function enableJurisdiction(actor: OrgActor, orgId: string, key: string) {
  if (!isJurisdictionKey(key)) throw new Error(`Unknown jurisdiction: ${key}`);
  const db = getAdminDb();
  return mutate(
    db,
    { orgId, userId: actor.userId },
    { action: "org_jurisdiction.enable", entityType: "org_jurisdiction", amr: "password" },
    async (tx) => {
      await tx
        .insert(orgJurisdictions)
        .values({ orgId, jurisdictionKey: key, enabledBy: actor.userId, disabledAt: null })
        .onConflictDoUpdate({
          target: [orgJurisdictions.orgId, orgJurisdictions.jurisdictionKey],
          set: { disabledAt: null, enabledBy: actor.userId, updatedAt: new Date() },
        });
    },
  );
}

export async function disableJurisdiction(actor: OrgActor, orgId: string, key: string) {
  const db = getAdminDb();
  return mutate(
    db,
    { orgId, userId: actor.userId },
    { action: "org_jurisdiction.disable", entityType: "org_jurisdiction", amr: "password" },
    async (tx) => {
      await tx
        .update(orgJurisdictions)
        .set({ disabledAt: new Date(), updatedAt: new Date() })
        .where(
          and(eq(orgJurisdictions.orgId, orgId), eq(orgJurisdictions.jurisdictionKey, key)),
        );
    },
  );
}

export async function listEnabledJurisdictions(orgId: string): Promise<string[]> {
  const rows = await getAdminDb()
    .select({ key: orgJurisdictions.jurisdictionKey })
    .from(orgJurisdictions)
    .where(and(eq(orgJurisdictions.orgId, orgId), isNull(orgJurisdictions.disabledAt)));
  return rows.map((r) => r.key);
}

export async function inviteMember(
  actor: OrgActor,
  orgId: string,
  email: string,
  role: "admin" | "member",
) {
  const db = getAdminDb();
  return mutate(
    db,
    { orgId, userId: actor.userId },
    { action: "membership.invite", entityType: "membership", amr: "password" },
    async (tx) => {
      await tx
        .insert(memberships)
        .values({ orgId, email, role, status: "invited", invitedBy: actor.userId })
        .onConflictDoNothing({ target: [memberships.orgId, memberships.email] });
    },
  );
}

export async function listMembers(orgId: string) {
  return getAdminDb()
    .select({
      email: memberships.email,
      role: memberships.role,
      status: memberships.status,
    })
    .from(memberships)
    .where(eq(memberships.orgId, orgId));
}
