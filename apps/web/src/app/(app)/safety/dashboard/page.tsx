import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getSafetyDashboard } from "@/server/safety-dashboard";
import { SafetyTabs } from "../SafetyTabs";
import { SafetyDashboardView } from "./SafetyDashboardView";

export default async function SafetyDashboardPage() {
  const user = await getCurrentUser();

  let data: Awaited<ReturnType<typeof getSafetyDashboard>> | null = null;
  try {
    const orgId = user?.id ? await getActiveOrgId(user.id) : null;
    if (orgId) data = await getSafetyDashboard(orgId);
  } catch {
    // degrade
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <SafetyTabs active="dashboard" />
      <SafetyDashboardView data={data} />
    </div>
  );
}
