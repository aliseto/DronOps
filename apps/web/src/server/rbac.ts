import "server-only";
import { and, eq } from "drizzle-orm";
import { getAdminDb } from "@dronops/db";
import { memberships, userPersons, personRoles } from "@dronops/db/schema";
import type { DomainRole } from "@dronops/shared";

/**
 * Domain role guards. These read person_roles (operational authority), NOT
 * memberships.role (platform access). SoD checks (PR-B signatures, M2 CAPA)
 * compose on top of these.
 */

export async function getCurrentPersonId(orgId: string, userId: string): Promise<string | null> {
  const [row] = await getAdminDb()
    .select({ personId: userPersons.personId })
    .from(userPersons)
    .where(and(eq(userPersons.orgId, orgId), eq(userPersons.userId, userId)))
    .limit(1);
  return row?.personId ?? null;
}

export async function getPersonRoles(orgId: string, personId: string): Promise<string[]> {
  const rows = await getAdminDb()
    .select({ role: personRoles.role })
    .from(personRoles)
    .where(and(eq(personRoles.orgId, orgId), eq(personRoles.personId, personId)));
  return rows.map((r) => r.role);
}

export async function hasRole(orgId: string, userId: string, role: DomainRole): Promise<boolean> {
  const personId = await getCurrentPersonId(orgId, userId);
  if (!personId) return false;
  return (await getPersonRoles(orgId, personId)).includes(role);
}

export async function requireRole(
  orgId: string,
  userId: string,
  role: DomainRole,
): Promise<void> {
  if (!(await hasRole(orgId, userId, role))) {
    throw new Error(`This action requires the ${role} role.`);
  }
}

export async function hasAnyRole(
  orgId: string,
  userId: string,
  roles: DomainRole[],
): Promise<boolean> {
  const personId = await getCurrentPersonId(orgId, userId);
  if (!personId) return false;
  const have = await getPersonRoles(orgId, personId);
  return roles.some((r) => have.includes(r));
}

export async function requireAnyRole(
  orgId: string,
  userId: string,
  roles: DomainRole[],
): Promise<void> {
  if (!(await hasAnyRole(orgId, userId, roles))) {
    throw new Error(`This action requires one of: ${roles.join(", ")}.`);
  }
}

/**
 * Platform-access role (memberships.role), NOT a domain role. Access management
 * is gated on this so a fresh org owner — who has no domain roles yet — can
 * still link people and grant domain roles (bootstrap, no chicken-and-egg).
 */
export async function getMembershipRole(orgId: string, userId: string): Promise<string | null> {
  const [row] = await getAdminDb()
    .select({ role: memberships.role })
    .from(memberships)
    .where(
      and(eq(memberships.orgId, orgId), eq(memberships.userId, userId), eq(memberships.status, "active")),
    )
    .limit(1);
  return row?.role ?? null;
}

export async function isOrgAdmin(orgId: string, userId: string): Promise<boolean> {
  const role = await getMembershipRole(orgId, userId);
  return role === "owner" || role === "admin";
}

export async function requireOrgAdmin(orgId: string, userId: string): Promise<void> {
  if (!(await isOrgAdmin(orgId, userId))) {
    throw new Error("This action requires an organization owner or admin.");
  }
}
