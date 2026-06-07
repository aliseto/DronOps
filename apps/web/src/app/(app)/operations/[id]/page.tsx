import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getCurrentPersonId, getPersonRoles } from "@/server/rbac";
import { listPersons } from "@/server/distributions";
import { getMissionDetail, getMissionThread } from "@/server/operations";
import { allowedTransitions, type MissionState } from "@dronops/shared";
import { MissionDetailView } from "./MissionDetailView";

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const orgId = user?.id ? await getActiveOrgId(user.id) : null;
  if (!orgId) notFound();

  const detail = await getMissionDetail(orgId, id);
  if (!detail) notFound();

  const personId = user?.id ? await getCurrentPersonId(orgId, user.id) : null;
  const roles = personId ? await getPersonRoles(orgId, personId) : [];
  const persons = await listPersons(orgId);
  const thread = await getMissionThread(orgId, id);
  const transitions = allowedTransitions(detail.mission.status as MissionState, roles).map((t) => ({
    to: t.to,
    label: t.label,
    crewGate: t.crewGate,
  }));

  return (
    <MissionDetailView
      detail={detail}
      transitions={transitions}
      persons={persons}
      roles={roles}
      thread={thread}
      canNote={roles.includes("operations_team") || roles.includes("approval_admin") || roles.includes("ops_manager")}
    />
  );
}
