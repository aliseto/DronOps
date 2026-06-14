import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getCurrentPersonId, getPersonRoles } from "@/server/rbac";
import { listEnabledJurisdictions } from "@/server/org";
import { missionBindableJurisdictions } from "@dronops/content";
import { listFleet } from "@/server/fleet";
import { listMissions, getMissionDetail } from "@/server/operations";
import { allowedTransitions, type MissionState } from "@dronops/shared";
import { OperationsView } from "./OperationsView";

export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ panel?: string }>;
}) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  const id = sp.panel?.startsWith("mission:") ? sp.panel.slice(8) : undefined;

  let missions: Awaited<ReturnType<typeof listMissions>> = [];
  let aircraftOptions: { id: string; label: string }[] = [];
  let jurisdictions: string[] = [];
  let roles: string[] = [];
  let detail: Awaited<ReturnType<typeof getMissionDetail>> = null;
  let transitions: { to: string; label: string; crewGate?: boolean }[] = [];
  try {
    const orgId = user?.id ? await getActiveOrgId(user.id) : null;
    if (orgId) {
      missions = await listMissions(orgId);
      aircraftOptions = (await listFleet(orgId)).map((a) => ({ id: a.id, label: a.label }));
      // A mission binds one operative REGULATOR layer (federal vs emirate for
      // UAE); ISO and other standards are never mission-gated.
      jurisdictions = missionBindableJurisdictions(await listEnabledJurisdictions(orgId));
      const personId = user?.id ? await getCurrentPersonId(orgId, user.id) : null;
      roles = personId ? await getPersonRoles(orgId, personId) : [];
      if (id) {
        detail = await getMissionDetail(orgId, id);
        if (detail) {
          transitions = allowedTransitions(detail.mission.status as MissionState, roles).map((t) => ({ to: t.to, label: t.label, crewGate: t.crewGate }));
        }
      }
    }
  } catch {
    // degrade
  }

  const blocked = missions.filter((m) => m.blockingCrew > 0).length;
  const inApproval = missions.filter((m) => m.status === "submitted_for_approval" || m.status === "approval_in_progress").length;

  return (
    <OperationsView
      missions={missions}
      exceptions={{ blocked, inApproval }}
      canCreate={roles.includes("operations_team") || roles.includes("ops_manager")}
      jurisdictions={jurisdictions}
      aircraftOptions={aircraftOptions}
      detail={detail}
      transitions={transitions}
    />
  );
}
