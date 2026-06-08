"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, DataTable, EmptyState, Input, StatusPill, type Column, type StatusVocab } from "@dronops/ui";
import type { AuditPackListItem } from "@/server/audit-pack";
import { createPackAction } from "./actions";

type Doc = StatusVocab["document"];
const fmt = (iso: string) => iso.slice(0, 10);
// pack status → StatusPill document tones (draft / sealed≈effective).
const pillStatus = (s: string): Doc => (s === "sealed" ? "effective" : "draft");

/** Quarter / year quick-picks → [start, end] ISO date strings. */
function presets(): { label: string; start: string; end: string }[] {
  const now = new Date();
  const y = now.getUTCFullYear();
  const q = Math.floor(now.getUTCMonth() / 3); // 0..3
  const prevQ = q === 0 ? 3 : q - 1;
  const prevQy = q === 0 ? y - 1 : y;
  const qStart = (yr: number, qi: number) => `${yr}-${String(qi * 3 + 1).padStart(2, "0")}-01`;
  const qEnd = (yr: number, qi: number) => [`${yr}-03-31`, `${yr}-06-30`, `${yr}-09-30`, `${yr}-12-31`][qi]!;
  return [
    { label: `Q${prevQ + 1} ${prevQy}`, start: qStart(prevQy, prevQ), end: qEnd(prevQy, prevQ) },
    { label: `Q${q + 1} ${y}`, start: qStart(y, q), end: qEnd(y, q) },
    { label: `${y - 1} (year)`, start: `${y - 1}-01-01`, end: `${y - 1}-12-31` },
    { label: `${y} (year)`, start: `${y}-01-01`, end: `${y}-12-31` },
  ];
}

export function PacksView({ packs, canManage }: { packs: AuditPackListItem[]; canManage: boolean }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const columns: Column<AuditPackListItem>[] = [
    { key: "code", header: "Ref", width: "0.7fr", accessor: (r) => r.code, sortable: true, cell: (r) => <span className="font-mono tabular-nums text-fg-secondary">{r.code}</span> },
    { key: "title", header: "Audit pack", width: "1.8fr", accessor: (r) => r.title ?? "", cell: (r) => <span className="font-medium text-fg-primary">{r.title ?? "Compliance evidence pack"}</span> },
    { key: "frameworks", header: "Frameworks", width: "1fr", accessor: (r) => r.frameworks.length, cell: (r) => <span className="font-mono text-micro tabular-nums text-fg-muted">{r.frameworks.length || "—"}</span> },
    { key: "period", header: "Period", width: "1.2fr", accessor: (r) => r.periodStart, cell: (r) => <span className="font-mono text-micro tabular-nums text-fg-muted">{fmt(r.periodStart)} → {fmt(r.periodEnd)}</span> },
    { key: "status", header: "Status", width: "0.8fr", accessor: (r) => r.status, sortable: true, cell: (r) => <StatusPill domain="document" status={pillStatus(r.status)} /> },
    { key: "sealed", header: "Sealed", width: "0.8fr", accessor: (r) => r.sealedAt ?? "", cell: (r) => <span className="font-mono text-micro tabular-nums text-fg-muted">{r.sealedAt ? fmt(r.sealedAt) : "—"}</span> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-display text-fg-primary">Audit packs</h1>
          <p className="text-small text-fg-muted">
            Curated, point-in-time compliance evidence bundles. Pick the frameworks, period and the exact findings,
            documents and reviews to include; seal to freeze the snapshot and generate the printable PDF.
          </p>
        </div>
        {canManage && <Button variant="primary" onClick={() => setAdding((v) => !v)}>+ New pack</Button>}
      </div>

      {adding && canManage && (
        <Card title="New audit pack">
          <form
            action={async (fd) => {
              const id = await createPackAction(fd);
              setAdding(false);
              router.push(`/compliance/packs/${id}`);
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-small"><span className="text-fg-muted">Title</span><Input name="title" placeholder="GCAA annual audit pack 2026" className="min-w-[16rem]" /></label>
              <label className="flex flex-col gap-1 text-small"><span className="text-fg-muted">Period start *</span><Input name="periodStart" type="date" required value={start} onChange={(e) => setStart(e.target.value)} /></label>
              <label className="flex flex-col gap-1 text-small"><span className="text-fg-muted">Period end *</span><Input name="periodEnd" type="date" required value={end} onChange={(e) => setEnd(e.target.value)} /></label>
              <Button type="submit" variant="primary">Create</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-micro text-fg-muted">Quick-pick:</span>
              {presets().map((p) => (
                <button type="button" key={p.label} onClick={() => { setStart(p.start); setEnd(p.end); }} className="rounded-pill border border-strong px-2.5 py-0.5 text-micro text-fg-secondary hover:border-accent">
                  {p.label}
                </button>
              ))}
            </div>
          </form>
        </Card>
      )}

      <DataTable columns={columns} rows={packs} getRowId={(r) => r.id} onRowClick={(r) => router.push(`/compliance/packs/${r.id}`)} csvFileName="audit-packs" empty={<EmptyState title="No audit packs yet" description="Assemble a point-in-time evidence bundle for an auditor or regulator." />} />
    </div>
  );
}
