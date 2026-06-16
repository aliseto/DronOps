import { PageHeader } from "@dronops/ui";
import { schema } from "@dom/db";
import { getSessionUser } from "@/lib/session";
import { withRls } from "@/lib/db";
import { MembersView, type MemberRow, type PendingInvite, type OrgOption } from "./MembersView";

export default async function MembersPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const claims = { sub: user.id, email: user.email };
  const data = await withRls(claims, async (db) => ({
    tenantRoles: await db.select().from(schema.userTenantRoles),
    orgRoles: await db.select().from(schema.userOrgRoles),
    orgs: await db.select().from(schema.organisations),
    profiles: await db.select().from(schema.profiles),
    invites: await db.select().from(schema.invitations),
  }));

  // The tenant(s) where the signed-in user is an admin (owner/group_admin).
  const adminTenantIds = data.tenantRoles
    .filter((r) => r.userId === user.id && (r.role === "owner" || r.role === "group_admin"))
    .map((r) => r.tenantId);

  if (adminTenantIds.length === 0) {
    return (
      <>
        <PageHeader title="Members" description="Invite people and assign roles." />
        <div className="p-6">
          <p className="text-small text-fg-muted">
            Only a tenant owner or group admin can manage members.
          </p>
        </div>
      </>
    );
  }

  const tenantId = adminTenantIds[0]!;
  const emailById = new Map(data.profiles.map((p) => [p.id, p.email ?? "—"]));
  const orgsInTenant = data.orgs.filter((o) => o.tenantId === tenantId);
  const orgName = new Map(orgsInTenant.map((o) => [o.id, o.name]));
  const orgIdsInTenant = new Set(orgsInTenant.map((o) => o.id));

  const members: MemberRow[] = [
    ...data.tenantRoles
      .filter((r) => r.tenantId === tenantId)
      .map((r) => ({ id: r.id, email: emailById.get(r.userId) ?? "—", scope: "Tenant", role: r.role })),
    ...data.orgRoles
      .filter((r) => orgIdsInTenant.has(r.orgId))
      .map((r) => ({ id: r.id, email: emailById.get(r.userId) ?? "—", scope: orgName.get(r.orgId) ?? "—", role: r.role })),
  ];

  const pending: PendingInvite[] = data.invites
    .filter((i) => i.tenantId === tenantId && i.status === "pending")
    .map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      scope: i.orgId ? (orgName.get(i.orgId) ?? "Organisation") : "Tenant",
      tokenHash: i.tokenHash,
      expiresAt: i.expiresAt.toISOString().slice(0, 10),
    }));

  const orgOptions: OrgOption[] = orgsInTenant.map((o) => ({ id: o.id, name: o.name }));

  return (
    <>
      <PageHeader title="Members" description="Invite people and assign roles." />
      <div className="p-6">
        <MembersView tenantId={tenantId} orgs={orgOptions} members={members} pending={pending} />
      </div>
    </>
  );
}
