import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getCurrentPersonId, getPersonRoles } from "@/server/rbac";
import { listHazards, recurringDeviations } from "@/server/hazards";
import { SafetyTabs } from "../SafetyTabs";
import { HazardRegisterView } from "./HazardRegisterView";

export default async function HazardsPage() {
  const user = await getCurrentUser();

  let hazards: Awaited<ReturnType<typeof listHazards>> = [];
  let recurring: Awaited<ReturnType<typeof recurringDeviations>> = [];
  let canManage = false;
  try {
    const orgId = user?.id ? await getActiveOrgId(user.id) : null;
    if (orgId) {
      hazards = await listHazards(orgId);
      recurring = await recurringDeviations(orgId);
      const personId = user?.id ? await getCurrentPersonId(orgId, user.id) : null;
      const roles = personId ? await getPersonRoles(orgId, personId) : [];
      canManage = roles.includes("quality_manager") || roles.includes("ops_manager") || roles.includes("accountable_manager");
    }
  } catch {
    // degrade
  }

  return (
    <div className="flex flex-col gap-4">
      <SafetyTabs active="hazards" />
      <HazardRegisterView hazards={hazards} recurring={recurring} canManage={canManage} />
    </div>
  );
}
