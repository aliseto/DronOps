import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getCurrentPersonId, getPersonRoles } from "@/server/rbac";
import { listEnabledJurisdictions } from "@/server/org";
import { listOccurrences } from "@/server/safety";
import { JURISDICTIONS, missionBindableJurisdictions } from "@dronops/content";
import { SafetyTabs } from "./SafetyTabs";
import { SafetyView } from "./SafetyView";

export default async function SafetyPage() {
  const user = await getCurrentUser();

  let occurrences: Awaited<ReturnType<typeof listOccurrences>> = [];
  let jurisdictions: { key: string; label: string }[] = [];
  let canManage = false;
  try {
    const orgId = user?.id ? await getActiveOrgId(user.id) : null;
    if (orgId) {
      occurrences = await listOccurrences(orgId);
      const enabled = await listEnabledJurisdictions(orgId);
      // Same scoping rule as the coverage matrix: only regulator jurisdictions
      // carry an occurrence clock (ISO is excluded by missionBindableJurisdictions).
      jurisdictions = missionBindableJurisdictions(enabled).map((k) => ({ key: k, label: JURISDICTIONS[k as keyof typeof JURISDICTIONS]?.label ?? k }));
      const personId = user?.id ? await getCurrentPersonId(orgId, user.id) : null;
      const roles = personId ? await getPersonRoles(orgId, personId) : [];
      canManage = roles.includes("quality_manager") || roles.includes("ops_manager") || roles.includes("accountable_manager");
    }
  } catch {
    // degrade
  }

  return (
    <div className="flex flex-col gap-4">
      <SafetyTabs active="occurrences" />
      <SafetyView occurrences={occurrences} jurisdictions={jurisdictions} canManage={canManage} />
    </div>
  );
}
