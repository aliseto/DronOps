import { PageHeader } from "@dronops/ui";
import { getActiveContext } from "@/server/context";
import { listFleet } from "@/server/fleet";
import { FleetView } from "./FleetView";

export default async function FleetPage() {
  const ctx = await getActiveContext();
  const data = await listFleet(ctx);
  return (
    <>
      <PageHeader
        title="Fleet"
        description="Aircraft, batteries, controllers and equipment — shared specs on a profile, copied into each instance."
      />
      <div className="p-6">
        <FleetView data={data} />
      </div>
    </>
  );
}
