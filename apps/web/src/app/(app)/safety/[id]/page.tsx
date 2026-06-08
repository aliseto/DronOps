import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getCurrentPersonId, getPersonRoles } from "@/server/rbac";
import { getEntityHistory } from "@/server/history";
import { getOccurrenceDetail } from "@/server/safety";
import { OccurrenceDetailView } from "./OccurrenceDetailView";

export default async function OccurrencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const orgId = user?.id ? await getActiveOrgId(user.id) : null;
  if (!orgId) notFound();

  const detail = await getOccurrenceDetail(orgId, id);
  if (!detail) notFound();

  const personId = user?.id ? await getCurrentPersonId(orgId, user.id) : null;
  const roles = personId ? await getPersonRoles(orgId, personId) : [];
  const canManage = roles.includes("quality_manager") || roles.includes("ops_manager") || roles.includes("accountable_manager");
  const canEscalate = roles.includes("quality_manager") || roles.includes("accountable_manager");
  const history = await getEntityHistory(orgId, "occurrence", id);

  return <OccurrenceDetailView detail={detail} canManage={canManage} canEscalate={canEscalate} history={history} />;
}
