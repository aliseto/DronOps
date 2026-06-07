import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getCurrentPersonId, getPersonRoles } from "@/server/rbac";
import { listFindings, getFindingDetail } from "@/server/compliance";
import { ComplianceView } from "./ComplianceView";

export default async function CompliancePage({
  searchParams,
}: {
  searchParams: Promise<{ panel?: string }>;
}) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  const id = sp.panel?.startsWith("finding:") ? sp.panel.slice(8) : undefined;

  let findings: Awaited<ReturnType<typeof listFindings>> = [];
  let detail: Awaited<ReturnType<typeof getFindingDetail>> = null;
  let canTriage = false;
  try {
    const orgId = user?.id ? await getActiveOrgId(user.id) : null;
    if (orgId) {
      findings = await listFindings(orgId);
      const personId = user?.id ? await getCurrentPersonId(orgId, user.id) : null;
      const roles = personId ? await getPersonRoles(orgId, personId) : [];
      canTriage = roles.includes("quality_manager") || roles.includes("accountable_manager");
      if (id) detail = await getFindingDetail(orgId, id);
    }
  } catch {
    // degrade
  }

  const queue = findings.filter((f) => f.untriaged).length;
  const open = findings.filter((f) => !["closed", "false-positive"].includes(f.status)).length;

  return <ComplianceView findings={findings} queueCount={queue} openCount={open} detail={detail} canTriage={canTriage} />;
}
