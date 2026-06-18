import { PageHeader } from "@dronops/ui";
import { getActiveContext } from "@/server/context";
import { listFlightLogs } from "@/server/ingestion";
import { EvidenceView } from "./EvidenceView";

export default async function EvidencePage() {
  const ctx = await getActiveContext();
  const logs = await listFlightLogs(ctx);
  return (
    <>
      <PageHeader
        title="Flight evidence"
        description="Import DJI flight logs. v13+ records are AES-encrypted and decrypt server-side via the DJI Open API key."
      />
      <div className="p-6">
        <EvidenceView
          logs={logs.map((l) => ({
            id: l.id,
            storagePath: l.storagePath,
            sizeBytes: l.sizeBytes,
            parseStatus: l.parseStatus,
            parseError: l.parseError,
            createdAt: l.createdAt.toISOString(),
          }))}
        />
      </div>
    </>
  );
}
