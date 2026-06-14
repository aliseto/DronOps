"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, DataTable, EmptyState, Input, StatusPill, type Column, type StatusVocab } from "@dronops/ui";
import { SCENARIO_LABELS, type OperationalScenario } from "@dronops/shared";
import type { SoraListItem } from "@/server/sora";
import { SailBadge } from "./SailBadge";
import { createSoraAction } from "./actions";

const fmt = (iso: string) => iso.slice(0, 10);
const pill = (s: string): StatusVocab["document"] => (s === "approved" ? "effective" : "draft");

export function SoraListView({ items, canManage }: { items: SoraListItem[]; canManage: boolean }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  const columns: Column<SoraListItem>[] = [
    { key: "code", header: "Ref", width: "0.8fr", accessor: (r) => r.code, sortable: true, cell: (r) => <span className="font-mono tabular-nums text-fg-secondary">{r.code}</span> },
    { key: "title", header: "Assessment", width: "2fr", accessor: (r) => r.title, cell: (r) => <span className="font-medium text-fg-primary">{r.title}</span> },
    { key: "mission", header: "Mission", width: "0.8fr", accessor: (r) => r.missionCode ?? "", cell: (r) => <span className="font-mono text-micro tabular-nums text-fg-muted">{r.missionCode ?? "—"}</span> },
    { key: "scenario", header: "Scenario", width: "1.6fr", accessor: (r) => r.scenario, cell: (r) => <span className="text-small text-fg-secondary">{SCENARIO_LABELS[r.scenario as OperationalScenario] ?? r.scenario}</span> },
    { key: "sail", header: "SAIL", width: "0.7fr", accessor: (r) => r.sail, sortable: true, cell: (r) => <SailBadge sail={r.sail} roman={r.sailRoman} /> },
    { key: "status", header: "Status", width: "0.7fr", accessor: (r) => r.status, sortable: true, cell: (r) => <StatusPill domain="document" status={pill(r.status)} /> },
    { key: "approved", header: "Approved", width: "0.8fr", accessor: (r) => r.approvedAt ?? "", cell: (r) => <span className="font-mono text-micro tabular-nums text-fg-muted">{r.approvedAt ? fmt(r.approvedAt) : "—"}</span> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-display text-fg-primary">SORA assessments</h1>
          <p className="text-small text-fg-muted">JARUS SORA 2.0 specific-category risk assessments — ground &amp; air risk to SAIL determination.</p>
        </div>
        {canManage && <Button variant="primary" onClick={() => setAdding((v) => !v)}>+ New SORA</Button>}
      </div>

      {adding && canManage && (
        <Card title="New SORA assessment">
          <form
            action={async (fd) => { const id = await createSoraAction(fd); setAdding(false); router.push(`/safety/sora/${id}`); }}
            className="flex flex-wrap items-end gap-3"
          >
            <label className="flex flex-col gap-1 text-small"><span className="text-fg-muted">Title *</span><Input name="title" required placeholder="BVLOS corridor survey — SORA" className="min-w-[20rem]" /></label>
            <Button type="submit" variant="primary">Create</Button>
            <span className="text-micro text-fg-muted">You set the scenario, mitigations and air risk on the next screen.</span>
          </form>
        </Card>
      )}

      <DataTable
        columns={columns}
        rows={items}
        getRowId={(r) => r.id}
        onRowClick={(r) => router.push(`/safety/sora/${r.id}`)}
        csvFileName="sora-assessments"
        empty={<EmptyState title="No SORA assessments" description={canManage ? "Create a SORA to determine the SAIL for a specific-category operation." : "SORA assessments appear here."} />}
      />
    </div>
  );
}
