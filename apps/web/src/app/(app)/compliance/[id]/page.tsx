import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getCurrentPersonId, getPersonRoles } from "@/server/rbac";
import { getEntityHistory } from "@/server/history";
import { listPersons } from "@/server/distributions";
import { getFindingDetail } from "@/server/compliance";
import { FindingDetailView } from "./FindingDetailView";

export default async function FindingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const orgId = user?.id ? await getActiveOrgId(user.id) : null;
  if (!orgId) notFound();

  const detail = await getFindingDetail(orgId, id);
  if (!detail) notFound();

  const personId = user?.id ? await getCurrentPersonId(orgId, user.id) : null;
  const roles = personId ? await getPersonRoles(orgId, personId) : [];
  const persons = await listPersons(orgId);
  const history = await getEntityHistory(orgId, "finding", id);
  const canManage = roles.includes("quality_manager") || roles.includes("accountable_manager");

  return <FindingDetailView detail={detail} persons={persons} history={history} canManage={canManage} />;
}
