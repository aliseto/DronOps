"use client";

import { Badge, Button, Card, EmptyState } from "@dronops/ui";
import { importLogAction, retryParseAction } from "./actions";

interface LogRow {
  id: string;
  storagePath: string | null;
  sizeBytes: number | null;
  parseStatus: "pending" | "processing" | "parsed" | "failed";
  parseError: string | null;
  createdAt: string;
}

const tone: Record<LogRow["parseStatus"], "neutral" | "accent" | "external"> = {
  pending: "neutral",
  processing: "accent",
  parsed: "accent",
  failed: "external",
};

function kb(n: number | null) {
  return n == null ? "—" : `${(n / 1024).toFixed(0)} KB`;
}

export function EvidenceView({ logs }: { logs: LogRow[] }) {
  const failed = logs.filter((l) => l.parseStatus === "failed");
  const ok = logs.filter((l) => l.parseStatus !== "failed");

  return (
    <div className="flex flex-col gap-4">
      <Card title="Import DJI log">
        <form action={importLogAction} className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            name="file"
            accept=".txt"
            required
            className="text-small text-fg-secondary file:mr-3 file:rounded-md file:border file:border-default file:bg-surface file:px-3 file:py-1.5 file:text-small file:text-fg-secondary"
          />
          <Button type="submit" size="sm">Upload &amp; parse</Button>
        </form>
        <p className="mt-2 text-micro text-fg-muted">
          DJI flight records (v13+) are AES-encrypted; until the DJI Open API key is configured the log is stored and
          held in the error tray awaiting decryption.
        </p>
      </Card>

      {failed.length > 0 && (
        <Card title={`Error tray (${failed.length})`}>
          <ul className="flex flex-col">
            {failed.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 border-b border-subtle py-2 text-small last:border-0">
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-fg-primary">{l.storagePath?.split("/").pop() ?? l.id}</span>
                  <span className="truncate text-micro text-status-danger-fg">{l.parseError}</span>
                </span>
                <form action={retryParseAction}>
                  <input type="hidden" name="id" value={l.id} />
                  <Button type="submit" variant="ghost" size="sm">Retry</Button>
                </form>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title={`Flight logs (${logs.length})`}>
        {logs.length === 0 ? (
          <EmptyState variant="first-use" title="No flight logs yet" description="Upload a DJI .txt log above." />
        ) : (
          <ul className="flex flex-col">
            {ok.length === 0 && failed.length > 0 && (
              <li className="py-2 text-small text-fg-muted">All current logs are in the error tray above.</li>
            )}
            {logs.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 border-b border-subtle py-2 text-small last:border-0">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-fg-primary">{l.storagePath?.split("/").pop() ?? l.id}</span>
                  <span className="text-micro text-fg-muted">{kb(l.sizeBytes)}</span>
                </span>
                <Badge tone={tone[l.parseStatus]}>{l.parseStatus}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
