import { PageHeader } from "@dronops/ui";
import { getActiveContext } from "@/server/context";
import { listOperations } from "@/server/operations";
import { OperationsView } from "./OperationsView";

export default async function OperationsPage() {
  const ctx = await getActiveContext();
  const data = await listOperations(ctx);
  return (
    <>
      <PageHeader
        title="Operations"
        description="Projects, missions and the imported flight log. A mission is approved by the regulator, not internally."
      />
      <div className="p-6">
        <OperationsView data={data} />
      </div>
    </>
  );
}
