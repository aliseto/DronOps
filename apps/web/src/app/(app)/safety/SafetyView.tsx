"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, DataTable, EmptyState, Input, Select, StatusPill, Textarea, JurisdictionBadge, type Column, type StatusVocab } from "@dronops/ui";
import type { OccurrenceListItem } from "@/server/safety";
import { DeadlineChip } from "./DeadlineChip";
import { fileOccurrenceAction } from "./actions";
import { enqueueOccurrence } from "@/lib/offline/occurrence-queue";

type Ncr = StatusVocab["ncr"];
const fmt = (iso: string) => iso.slice(0, 10);

// occurrence status → StatusPill ncr tones (open / investigating≈CAPA-in-progress / closed).
const pillStatus = (s: string): Ncr => (s === "closed" ? "closed" : s === "investigating" ? "capa-in-progress" : "open");

const CLASS_LABEL: Record<string, string> = { incident: "Incident", accident: "Accident", hazard_observation: "Hazard obs." };
const CLASS_MARK: Record<string, string> = { incident: "⚠", accident: "⛔", hazard_observation: "◇" };

export function SafetyView({
  occurrences,
  jurisdictions,
  canManage,
}: {
  occurrences: OccurrenceListItem[];
  jurisdictions: { key: string; label: string }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  // The jurisdiction column is load-bearing only when the tenant spans more than
  // one regulator (the UAE federal/Dubai dual-layer, where the deadline differs:
  // 3h vs 72h). Single-jurisdiction tenants state it once in page context.
  const showJurisdiction = jurisdictions.length > 1;
  const contextJurisdiction = jurisdictions.length === 1 ? jurisdictions[0] : null;

  const columns: Column<OccurrenceListItem>[] = [
    { key: "code", header: "Ref", width: "0.7fr", accessor: (r) => r.code, sortable: true, cell: (r) => <span className="font-mono tabular-nums text-fg-secondary">{r.code}</span> },
    { key: "class", header: "Class", width: "0.8fr", accessor: (r) => r.classification, sortable: true, cell: (r) => <span className="text-small text-fg-secondary"><span aria-hidden>{CLASS_MARK[r.classification]}</span> {CLASS_LABEL[r.classification]}</span> },
    { key: "title", header: "Occurrence", width: "2fr", accessor: (r) => r.title, cell: (r) => <span className="font-medium text-fg-primary">{r.title}{r.escalated && <span className="ml-2 rounded bg-status-info-bg px-1.5 py-0.5 text-micro text-status-info-fg">NCR</span>}</span> },
    ...(showJurisdiction
      ? [{ key: "jur", header: "Jurisdiction", width: "1fr", accessor: (r: OccurrenceListItem) => r.jurisdiction, sortable: true, cell: (r: OccurrenceListItem) => <JurisdictionBadge jurisdiction={r.jurisdiction} /> } as Column<OccurrenceListItem>]
      : []),
    { key: "occurred", header: "Occurred", width: "0.9fr", accessor: (r) => r.occurredAt, sortable: true, cell: (r) => <span className="font-mono text-micro tabular-nums text-fg-muted">{fmt(r.occurredAt)}</span> },
    { key: "status", header: "Status", width: "0.9fr", accessor: (r) => r.status, sortable: true, cell: (r) => <StatusPill domain="ncr" status={pillStatus(r.status)} /> },
    // Freed width from the hidden jurisdiction column goes to the headline chip.
    { key: "deadline", header: "Reporting deadline", width: showJurisdiction ? "1.4fr" : "1.7fr", accessor: (r) => r.deadline.remainingMs ?? 0, cell: (r) => <DeadlineChip deadline={r.deadline} /> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-display text-fg-primary">Safety occurrences</h1>
          <p className="text-small text-fg-muted">
            Occurrence reporting &amp; investigation. Reporting deadlines are bound per record by jurisdiction
            {contextJurisdiction ? <> — this operator reports under <span className="font-medium text-fg-secondary">{contextJurisdiction.label}</span>.</> : <> (UAE federal 3h · Dubai 72h).</>}
          </p>
        </div>
        <Button variant="primary" onClick={() => setAdding((v) => !v)}>+ File occurrence</Button>
      </div>

      {adding && (
        <Card title="File occurrence">
          <form
            action={async (fd) => {
              if (jurisdictions.length === 1) fd.set("jurisdiction", jurisdictions[0]!.key);
              // Field capture (UX §10): offline filings queue with the device
              // timestamp and sync automatically — never lost, never blocked.
              if (!navigator.onLine) {
                await enqueueOccurrence(Object.fromEntries([...fd.entries()].map(([k, v]) => [k, String(v)])));
                setAdding(false);
                return;
              }
              const id = await fileOccurrenceAction(fd);
              setAdding(false);
              router.push(`/safety/${id}`);
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-small">
                <span className="text-fg-muted">Classification *</span>
                <Select name="classification" defaultValue="incident" options={[{ value: "incident", label: "Incident" }, { value: "accident", label: "Accident" }, { value: "hazard_observation", label: "Hazard observation" }]} />
              </label>
              {jurisdictions.length > 1 && (
                <label className="flex flex-col gap-1 text-small">
                  <span className="text-fg-muted">Jurisdiction *</span>
                  <Select name="jurisdiction" options={jurisdictions.map((j) => ({ value: j.key, label: j.label }))} />
                </label>
              )}
              <label className="flex flex-col gap-1 text-small">
                <span className="text-fg-muted">When it occurred *</span>
                <Input name="occurredAt" type="datetime-local" required />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-small"><span className="text-fg-muted">Title *</span><Input name="title" required placeholder="Prop strike during landing" /></label>
            <label className="flex flex-col gap-1 text-small"><span className="text-fg-muted">What happened</span><Textarea name="description" rows={2} placeholder="Brief factual account — who, what, where." /></label>
            <div className="flex items-center gap-3">
              <Button type="submit" variant="primary">File</Button>
              <span className="text-micro text-fg-muted">Anyone can file. The reporting clock starts from the occurrence time.</span>
            </div>
          </form>
        </Card>
      )}

      <DataTable
        columns={columns}
        rows={occurrences}
        getRowId={(r) => r.id}
        onRowClick={(r) => router.push(`/safety/${r.id}`)}
        csvFileName="occurrences"
        empty={<EmptyState title="No occurrences filed" description={canManage ? "File the first incident, accident or hazard observation." : "Occurrences filed by the crew appear here."} />}
      />
    </div>
  );
}
