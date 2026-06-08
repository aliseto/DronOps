import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getCurrentPersonId, getPersonRoles } from "@/server/rbac";
import { getEntityHistory } from "@/server/history";
import { getAuditPackDetail, getPackCandidates } from "@/server/audit-pack";
import { PackBuilderView } from "./PackBuilderView";

export default async function PackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const orgId = user?.id ? await getActiveOrgId(user.id) : null;
  if (!orgId) notFound();

  const detail = await getAuditPackDetail(orgId, id);
  if (!detail) notFound();

  const personId = user?.id ? await getCurrentPersonId(orgId, user.id) : null;
  const roles = personId ? await getPersonRoles(orgId, personId) : [];
  const canManage = roles.includes("quality_manager") || roles.includes("accountable_manager");
  // Candidates only needed while editing a draft.
  const candidates = detail.status === "draft" ? await getPackCandidates(orgId) : null;
  const history = await getEntityHistory(orgId, "audit_pack", id);

  return <PackBuilderView detail={detail} candidates={candidates} canManage={canManage} history={history} />;
}
