import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getCurrentPersonId, getPersonRoles } from "@/server/rbac";
import { listManagementReviews } from "@/server/management-review";
import { ComplianceTabs } from "../ComplianceTabs";
import { ReviewsView } from "./ReviewsView";

export default async function ReviewsPage() {
  const user = await getCurrentUser();

  let reviews: Awaited<ReturnType<typeof listManagementReviews>> = [];
  let canManage = false;
  try {
    const orgId = user?.id ? await getActiveOrgId(user.id) : null;
    if (orgId) {
      reviews = await listManagementReviews(orgId);
      const personId = user?.id ? await getCurrentPersonId(orgId, user.id) : null;
      const roles = personId ? await getPersonRoles(orgId, personId) : [];
      canManage = roles.includes("quality_manager") || roles.includes("accountable_manager");
    }
  } catch {
    // degrade
  }

  return (
    <div className="flex flex-col gap-4">
      <ComplianceTabs active="reviews" />
      <ReviewsView reviews={reviews} canManage={canManage} />
    </div>
  );
}
