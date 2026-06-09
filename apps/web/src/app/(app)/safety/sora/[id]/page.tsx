import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getCurrentPersonId, getPersonRoles } from "@/server/rbac";
import { getEntityHistory } from "@/server/history";
import { getSoraDetail } from "@/server/sora";
import { SoraBuilderView } from "./SoraBuilderView";

export default async function SoraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const orgId = user?.id ? await getActiveOrgId(user.id) : null;
  if (!orgId) notFound();

  const detail = await getSoraDetail(orgId, id);
  if (!detail) notFound();

  const personId = user?.id ? await getCurrentPersonId(orgId, user.id) : null;
  const roles = personId ? await getPersonRoles(orgId, personId) : [];
  const canEdit = roles.includes("operations_team") || roles.includes("ops_manager") || roles.includes("accountable_manager");
  const canApprove = roles.includes("ops_manager") || roles.includes("accountable_manager");
  const history = await getEntityHistory(orgId, "sora_assessment", id);

  return <SoraBuilderView detail={detail} canEdit={canEdit} canApprove={canApprove} history={history} />;
}
