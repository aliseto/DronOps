import { redirect } from "next/navigation";
import { PageHeader } from "@dronops/ui";
import { DOMAIN_ROLES, DOMAIN_ROLE_LABELS } from "@dronops/shared";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { isOrgAdmin } from "@/server/rbac";
import { listAccess } from "@/server/access";
import { AccessView } from "./AccessView";

/**
 * Access management (Settings → Access). Owner/admin only: link members to an
 * operational person and grant domain roles. This is what makes a new org
 * usable — without it members have no roles and the app reads empty.
 */
export default async function AccessPage() {
  const user = await getCurrentUser();
  const orgId = user?.id ? await getActiveOrgId(user.id) : null;
  if (!user?.id || !orgId) redirect("/signin");

  const admin = await isOrgAdmin(orgId, user.id);
  const rows = admin ? await listAccess(orgId) : [];

  return (
    <>
      <PageHeader title="Access & roles" description="Link members to a person and assign domain roles." />
      <div className="p-6">
        {admin ? (
          <AccessView
            rows={rows}
            allRoles={DOMAIN_ROLES.map((r) => ({ value: r, label: DOMAIN_ROLE_LABELS[r] }))}
          />
        ) : (
          <p className="text-small text-fg-muted">
            Only an organization owner or admin can manage access and roles.
          </p>
        )}
      </div>
    </>
  );
}
