import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { hasAnyRole } from "@/server/rbac";
import { getEntityHistory } from "@/server/history";
import { listEnabledJurisdictions } from "@/server/org";
import { listFleet, getAircraftDetail } from "@/server/fleet";
import {
  AIRFRAME_CLASSES,
  GACA_AIRCRAFT_CLASSES,
  COMPONENT_KINDS,
  MAINTENANCE_TYPES,
} from "@dronops/content";
import { FleetView } from "./FleetView";

export default async function FleetPage({
  searchParams,
}: {
  searchParams: Promise<{ panel?: string }>;
}) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  const id = sp.panel?.startsWith("aircraft:") ? sp.panel.slice(9) : undefined;

  // Best-effort: the page must still render (heading, shell) if the data layer is
  // unavailable — e.g. the no-DB e2e environment. Degrades to an empty fleet.
  let fleet: Awaited<ReturnType<typeof listFleet>> = [];
  let canManage = false;
  let jurisdictions: string[] = [];
  let detail: Awaited<ReturnType<typeof getAircraftDetail>> = null;
  let history: Awaited<ReturnType<typeof getEntityHistory>> = [];
  try {
    const orgId = user?.id ? await getActiveOrgId(user.id) : null;
    if (orgId) {
      fleet = await listFleet(orgId);
      jurisdictions = await listEnabledJurisdictions(orgId);
      if (user?.id) {
        canManage = await hasAnyRole(orgId, user.id, [
          "quality_manager",
          "accountable_manager",
          "ops_manager",
        ]);
      }
      if (id) {
        detail = await getAircraftDetail(orgId, id);
        history = await getEntityHistory(orgId, "aircraft", id);
      }
    }
  } catch {
    // leave defaults
  }

  const grounded = fleet.filter((a) => a.status === "grounded").length;
  const dueSoon = fleet.filter((a) => a.status === "due-soon").length;
  const overdue = fleet.filter((a) => a.maintenanceOverdue).length;

  return (
    <FleetView
      fleet={fleet}
      exceptions={{ grounded, dueSoon, overdue }}
      canManage={canManage}
      vocab={{
        airframeClasses: AIRFRAME_CLASSES.map((c) => ({ ...c })),
        gacaClasses: GACA_AIRCRAFT_CLASSES.map((c) => ({ ...c })),
        componentKinds: COMPONENT_KINDS.map((c) => ({ ...c })),
        maintenanceTypes: MAINTENANCE_TYPES.map((c) => ({ ...c })),
        jurisdictions,
      }}
      detail={detail}
      history={history}
    />
  );
}
