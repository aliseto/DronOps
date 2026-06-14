import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getCurrentPersonId, getPersonRoles } from "@/server/rbac";
import { listAuditPacks } from "@/server/audit-pack";
import { ComplianceTabs } from "../ComplianceTabs";
import { PacksView } from "./PacksView";

export default async function PacksPage() {
  const user = await getCurrentUser();

  let packs: Awaited<ReturnType<typeof listAuditPacks>> = [];
  let canManage = false;
  try {
    const orgId = user?.id ? await getActiveOrgId(user.id) : null;
    if (orgId) {
      packs = await listAuditPacks(orgId);
      const personId = user?.id ? await getCurrentPersonId(orgId, user.id) : null;
      const roles = personId ? await getPersonRoles(orgId, personId) : [];
      canManage = roles.includes("quality_manager") || roles.includes("accountable_manager");
    }
  } catch {
    // degrade
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <ComplianceTabs active="packs" />
      <PacksView packs={packs} canManage={canManage} />
    </div>
  );
}
