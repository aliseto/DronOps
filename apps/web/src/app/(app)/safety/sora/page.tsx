import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getCurrentPersonId, getPersonRoles } from "@/server/rbac";
import { listSora } from "@/server/sora";
import { SafetyTabs } from "../SafetyTabs";
import { SoraListView } from "./SoraListView";

export default async function SoraPage() {
  const user = await getCurrentUser();

  let items: Awaited<ReturnType<typeof listSora>> = [];
  let canManage = false;
  try {
    const orgId = user?.id ? await getActiveOrgId(user.id) : null;
    if (orgId) {
      items = await listSora(orgId);
      const personId = user?.id ? await getCurrentPersonId(orgId, user.id) : null;
      const roles = personId ? await getPersonRoles(orgId, personId) : [];
      canManage = roles.includes("operations_team") || roles.includes("ops_manager") || roles.includes("accountable_manager");
    }
  } catch {
    // degrade
  }

  return (
    <div className="flex flex-col gap-4">
      <SafetyTabs active="sora" />
      <SoraListView items={items} canManage={canManage} />
    </div>
  );
}
