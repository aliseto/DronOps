"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, DataTable, EmptyState, Input, Select, Textarea, type Column } from "@dronops/ui";
import type { HazardListItem, RecurringDeviation } from "@/server/hazards";
import { BandChip } from "./RiskMatrix";
import { createHazardAction, createHazardFromDeviationAction } from "./actions";

const REVIEW_TONE: Record<string, string> = {
  overdue: "bg-status-danger-bg text-status-danger-fg",
  "due-soon": "bg-status-warn-bg text-status-warn-fg",
  ok: "bg-status-ok-bg text-status-ok-fg",
  none: "bg-status-neutral-bg text-fg-muted",
};
const REVIEW_LABEL: Record<string, string> = { overdue: "Overdue", "due-soon": "Due soon", ok: "On track", none: "No cycle" };
const STATUS_LABEL: Record<string, string> = { open: "Open", monitored: "Monitored", closed: "Closed" };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function HazardRegisterView({
  hazards,
  recurring,
  canManage,
}: {
  hazards: HazardListItem[];
  recurring: RecurringDeviation[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const unlinked = recurring.filter((r) => !r.linkedHazardCode);

  const columns: Column<HazardListItem>[] = [
    { key: "code", header: "Ref", width: "0.7fr", accessor: (r) => r.code, sortable: true, cell: (r) => <span className="font-mono tabular-nums text-fg-secondary">{r.code}</span> },
    { key: "title", header: "Hazard", width: "2fr", accessor: (r) => r.title, cell: (r) => <span className="font-medium text-fg-primary">{r.title}</span> },
    { key: "cat", header: "Category", width: "0.9fr", accessor: (r) => r.category ?? "", cell: (r) => <span className="text-small text-fg-secondary">{r.category ? cap(r.category) : "—"}</span> },
    { key: "status", header: "Status", width: "0.7fr", accessor: (r) => r.status, sortable: true, cell: (r) => <span className="text-small text-fg-secondary">{STATUS_LABEL[r.status] ?? r.status}</span> },
    { key: "inherent", header: "Inherent", width: "0.8fr", accessor: (r) => r.inherentScore ?? 0, sortable: true, cell: (r) => <BandChip band={r.inherentBand} score={r.inherentScore} /> },
    { key: "residual", header: "Residual", width: "0.8fr", accessor: (r) => r.residualScore ?? 0, sortable: true, cell: (r) => <BandChip band={r.residualBand} score={r.residualScore} /> },
    { key: "review", header: "Review", width: "0.8fr", accessor: (r) => r.review, sortable: true, cell: (r) => <span className={`inline-flex rounded-pill px-2 py-0.5 text-micro font-medium ${REVIEW_TONE[r.review]}`}>{REVIEW_LABEL[r.review]}</span> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-display text-fg-primary">Hazard register</h1>
          <p className="text-small text-fg-muted">The SMS hazard log: inherent risk on the 5×5 matrix, residual risk after mitigation, and review cycles.</p>
        </div>
        {canManage && <Button variant="primary" onClick={() => setAdding((v) => !v)}>+ Add hazard</Button>}
      </div>

      {canManage && unlinked.length > 0 && (
        <Card title="Recurring deviations → register">
          <p className="mb-2 text-micro text-fg-muted">Deviation types raised ≥3 times with no register entry yet. Opening one creates a linked hazard.</p>
          <div className="flex flex-wrap gap-2">
            {unlinked.map((r) => (
              <button
                key={r.deviationCode}
                type="button"
                onClick={async () => { const id = await createHazardFromDeviationAction(r.deviationCode); router.push(`/safety/hazards/${id}`); }}
                className="inline-flex items-center gap-2 rounded-pill border border-strong px-2.5 py-1 text-small text-fg-secondary hover:border-accent"
              >
                <span className="font-medium text-fg-primary">{r.deviationCode.replace(/_/g, " ")}</span>
                <span className="font-mono text-micro tabular-nums text-status-warn-fg">×{r.count}</span>
                <span className="text-micro text-accent">+ open</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {adding && canManage && (
        <Card title="Add hazard">
          <form
            action={async (fd) => { const id = await createHazardAction(fd); setAdding(false); router.push(`/safety/hazards/${id}`); }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-small"><span className="text-fg-muted">Title *</span><Input name="title" required placeholder="Crowd ingress at landing zone" className="min-w-[18rem]" /></label>
              <label className="flex flex-col gap-1 text-small">
                <span className="text-fg-muted">Category</span>
                <Select name="category" defaultValue="operational" options={["operational", "technical", "environmental", "human", "external", "other"].map((v) => ({ value: v, label: cap(v) }))} />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-small"><span className="text-fg-muted">Description</span><Textarea name="description" rows={2} placeholder="What is the hazard and where does it arise?" /></label>
            <div><Button type="submit" variant="primary">Create</Button></div>
          </form>
        </Card>
      )}

      <DataTable
        columns={columns}
        rows={hazards}
        getRowId={(r) => r.id}
        onRowClick={(r) => router.push(`/safety/hazards/${r.id}`)}
        csvFileName="hazard-register"
        empty={<EmptyState title="No hazards logged" description={canManage ? "Add the first hazard, or open one from a recurring deviation." : "Hazards identified by the safety team appear here."} />}
      />
    </div>
  );
}
