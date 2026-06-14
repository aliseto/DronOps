import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { hasAnyRole } from "@/server/rbac";
import { getEntityHistory } from "@/server/history";
import { listEnabledJurisdictions } from "@/server/org";
import { listPersons } from "@/server/distributions";
import { listFleet } from "@/server/fleet";
import { listFlights, getFlightDetail } from "@/server/flight-evidence";
import { EvidenceView } from "./EvidenceView";

export default async function EvidencePage({
  searchParams,
}: {
  searchParams: Promise<{ panel?: string }>;
}) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  const id = sp.panel?.startsWith("flight:") ? sp.panel.slice(7) : undefined;

  // Best-effort: render the shell/heading even when the data layer is unavailable.
  let flights: Awaited<ReturnType<typeof listFlights>> = [];
  let aircraftOptions: { id: string; label: string }[] = [];
  let persons: { id: string; name: string }[] = [];
  let jurisdictions: string[] = [];
  let canManage = false;
  let detail: Awaited<ReturnType<typeof getFlightDetail>> = null;
  let history: Awaited<ReturnType<typeof getEntityHistory>> = [];
  try {
    const orgId = user?.id ? await getActiveOrgId(user.id) : null;
    if (orgId) {
      flights = await listFlights(orgId);
      aircraftOptions = (await listFleet(orgId)).map((a) => ({ id: a.id, label: a.label }));
      persons = await listPersons(orgId);
      jurisdictions = await listEnabledJurisdictions(orgId);
      if (user?.id) {
        canManage = await hasAnyRole(orgId, user.id, [
          "quality_manager",
          "accountable_manager",
          "ops_manager",
        ]);
      }
      if (id) {
        detail = await getFlightDetail(orgId, id);
        history = await getEntityHistory(orgId, "flight_record", id);
      }
    }
  } catch {
    // leave defaults
  }

  const withDeviations = flights.filter((f) => f.deviationCount > 0).length;
  const unsealed = flights.filter((f) => f.status !== "sealed").length;

  return (
    <EvidenceView
      flights={flights}
      exceptions={{ withDeviations, unsealed }}
      canManage={canManage}
      aircraftOptions={aircraftOptions}
      persons={persons}
      jurisdictions={jurisdictions}
      detail={detail}
      history={history}
    />
  );
}
