import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getCurrentPersonId, getPersonRoles } from "@/server/rbac";
import { getEntityHistory } from "@/server/history";
import { getManagementReviewDetail } from "@/server/management-review";
import { ReviewDetailView } from "./ReviewDetailView";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const orgId = user?.id ? await getActiveOrgId(user.id) : null;
  if (!orgId) notFound();

  const detail = await getManagementReviewDetail(orgId, id);
  if (!detail) notFound();

  const personId = user?.id ? await getCurrentPersonId(orgId, user.id) : null;
  const roles = personId ? await getPersonRoles(orgId, personId) : [];
  const canManage = roles.includes("quality_manager") || roles.includes("accountable_manager");
  const canSign = roles.includes("accountable_manager");
  const history = await getEntityHistory(orgId, "management_review", id);

  return <ReviewDetailView detail={detail} canManage={canManage} canSign={canSign} history={history} />;
}
