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
  const orgId = user?.id ? await getActiveOrgId(user.id) : null;

  const fleet = orgId ? await listFleet(orgId) : [];
  const canManage =
    orgId && user?.id
      ? await hasAnyRole(orgId, user.id, ["quality_manager", "accountable_manager", "ops_manager"])
      : false;
  const jurisdictions = orgId ? await listEnabledJurisdictions(orgId) : [];

  const sp = await searchParams;
  const id = sp.panel?.startsWith("aircraft:") ? sp.panel.slice(9) : undefined;
  const detail = orgId && id ? await getAircraftDetail(orgId, id) : null;
  const history = orgId && id ? await getEntityHistory(orgId, "aircraft", id) : [];

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
