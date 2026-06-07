"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Button,
  Card,
  DataTable,
  Drawer,
  EmptyState,
  Input,
  Select,
  StatusPill,
  type Column,
  type StatusVocab,
} from "@dronops/ui";
import { createMissionAction, transitionMissionAction } from "./actions";
import type { MissionDetail } from "@/server/operations";

type Lifecycle = StatusVocab["lifecycle"];
interface MissionRow {
  id: string;
  code: string;
  title: string;
  jurisdiction: string;
  operationalCategory: string;
  status: string;
  authority: string | null;
  plannedStartAt: string | null;
  plannedEndAt: string | null;
  blockingCrew: number;
  crewCount: number;
}
const fmtDate = (iso: string | null) => (iso ? iso.slice(0, 10) : "—");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function OperationsView({
  missions,
  exceptions,
  canCreate,
  jurisdictions,
  aircraftOptions,
  detail,
  transitions,
}: {
  missions: MissionRow[];
  exceptions: { blocked: number; inApproval: number };
  canCreate: boolean;
  jurisdictions: string[];
  aircraftOptions: { id: string; label: string }[];
  detail: MissionDetail | null;
  transitions: { to: string; label: string; crewGate?: boolean }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const open = (id: string) => router.push(`${pathname}?panel=mission:${id}`);
  const close = () => router.push(pathname);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? missions.filter((m) => m.title.toLowerCase().includes(n) || m.code.toLowerCase().includes(n)) : missions;
  }, [missions, q]);

  const columns: Column<MissionRow>[] = [
    {
      key: "mission",
      header: "Mission",
      width: "1.6fr",
      accessor: (m) => m.title,
      sortable: true,
      cell: (m) => (
        <span className="flex flex-col">
          <span className="font-medium text-fg-primary">{m.title}</span>
          <span className="text-micro text-fg-muted font-mono tabular-nums">{m.code} · {m.jurisdiction} · {cap(m.operationalCategory)}</span>
        </span>
      ),
    },
    { key: "status", header: "Lifecycle", width: "1fr", accessor: (m) => m.status, sortable: true, cell: (m) => <StatusPill domain="lifecycle" status={m.status as Lifecycle} /> },
    {
      key: "crew",
      header: "Crew gate",
      width: "0.8fr",
      accessor: (m) => m.blockingCrew,
      cell: (m) =>
        m.status === "approved" || m.status === "ready" ? (
          m.blockingCrew > 0 ? (
            <span className="text-small text-status-danger-fg">{m.blockingCrew} blocking</span>
          ) : (
            <span className="text-small text-status-ok-fg">clear</span>
          )
        ) : (
          <span className="text-micro text-fg-muted">—</span>
        ),
    },
    { key: "window", header: "Window", width: "0.9fr", accessor: (m) => m.plannedStartAt ?? "", cell: (m) => <span className="text-small text-fg-muted font-mono tabular-nums">{fmtDate(m.plannedStartAt)}</span> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-display text-fg-primary">Missions</h1>
          <p className="text-small text-fg-muted">
            Each mission carries its own approval lifecycle (DronOps is the system of record — the application is made
            on the authority portal). Crew currency + duty are evaluated at approved → ready.
          </p>
        </div>
        {canCreate && <Button variant="primary" onClick={() => setAdding((v) => !v)}>+ New mission</Button>}
      </div>

      {(exceptions.blocked > 0 || exceptions.inApproval > 0) && (
        <div className="flex flex-wrap gap-2 text-small">
          {exceptions.blocked > 0 && <span className="rounded-md bg-status-danger-bg px-3 py-1.5 text-status-danger-fg"><span className="font-mono tabular-nums">{exceptions.blocked}</span> crew-blocked</span>}
          {exceptions.inApproval > 0 && <span className="rounded-md bg-status-warn-bg px-3 py-1.5 text-status-warn-fg"><span className="font-mono tabular-nums">{exceptions.inApproval}</span> in approval</span>}
        </div>
      )}

      {adding && canCreate && (
        <Card title="New mission">
          <form action={createMissionAction} className="flex flex-wrap items-end gap-3" onSubmit={() => setTimeout(() => setAdding(false), 0)}>
            <label className="flex flex-col gap-1 text-small"><span className="text-fg-muted">Title *</span><Input name="title" required /></label>
            <label className="flex flex-col gap-1 text-small"><span className="text-fg-muted">Jurisdiction *</span><Select name="jurisdiction" required options={jurisdictions.map((j) => ({ value: j, label: j }))} /></label>
            <label className="flex flex-col gap-1 text-small"><span className="text-fg-muted">Operational category *</span>
              <Select name="operationalCategory" required options={[{ value: "open", label: "Open" }, { value: "standard", label: "Standard" }, { value: "specific", label: "Specific" }, { value: "advanced", label: "Advanced" }]} />
            </label>
            <label className="flex flex-col gap-1 text-small"><span className="text-fg-muted">Aircraft</span><Select name="aircraftId" placeholder="—" options={aircraftOptions.map((a) => ({ value: a.id, label: a.label }))} /></label>
            <label className="flex flex-col gap-1 text-small"><span className="text-fg-muted">Window start</span><Input name="plannedStartAt" type="date" /></label>
            <label className="flex flex-col gap-1 text-small"><span className="text-fg-muted">Window end</span><Input name="plannedEndAt" type="date" /></label>
            <Button type="submit" variant="primary">Create</Button>
          </form>
        </Card>
      )}

      <Input placeholder="Search missions…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />

      <DataTable columns={columns} rows={rows} getRowId={(m) => m.id} onRowClick={(m) => open(m.id)} csvFileName="missions" empty={<EmptyState title="No missions yet" description="Create a mission to start the approval lifecycle." />} />

      {detail && <TriageDrawer detail={detail} transitions={transitions} onClose={close} />}
    </div>
  );
}

function TriageDrawer({ detail, transitions, onClose }: { detail: MissionDetail; transitions: { to: string; label: string; crewGate?: boolean }[]; onClose: () => void }) {
  const m = detail.mission;
  const r = detail.readiness;
  return (
    <Drawer
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-3">
          <span>{m.title}</span>
          <StatusPill domain="lifecycle" status={m.status as Lifecycle} />
        </span>
      }
      footer={
        <div className="flex items-center justify-between gap-2">
          <Link href={`/operations/${m.id}`} className="text-small font-medium text-accent">Open full mission →</Link>
          <span className="flex gap-2">
            {transitions.map((t) =>
              t.to === "approved" ? (
                <Link key={t.to} href={`/operations/${m.id}`} className="rounded-md border border-strong px-3 py-1.5 text-small font-medium text-fg-primary">{t.label}…</Link>
              ) : (
                <Button
                  key={t.to}
                  variant={t.crewGate ? "primary" : "secondary"}
                  disabled={t.crewGate && r.blocked}
                  onClick={() => transitionMissionAction(m.id, t.to as never)}
                >
                  {t.label}
                </Button>
              ),
            )}
          </span>
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap gap-4 text-micro text-fg-muted">
        <span className="font-mono tabular-nums">{m.code}</span>
        <span>{m.jurisdiction} · {cap(m.operationalCategory)} (tier {r.riskTier})</span>
      </div>

      <div className="flex flex-col">
        <Row k="Authority" v={m.authority ? `${m.authority}${m.authorizationRef ? ` · ${m.authorizationRef}` : ""}` : "—"} />
        <Row k="Application ref" v={m.applicationRef ?? "—"} mono />
        <Row k="Window" v={`${fmtDate(m.plannedStartAt)} → ${fmtDate(m.plannedEndAt)}`} mono />
        <Row k="Aircraft" v={m.aircraftLabel ?? "—"} />
        <Row k="Ceiling" v={r.ceilingM != null ? `${r.ceilingM} m AGL` : "—"} mono />
      </div>

      {(m.status === "approved" || m.status === "ready") && (
        <div className="mt-3">
          {r.blocked ? (
            <div className="rounded-md bg-status-danger-bg px-3 py-2.5 text-small text-status-danger-fg">
              <div className="font-medium">Crew gate: {r.crew.filter((c) => c.blocksEffective).length} blocking</div>
              <ul className="mt-1 list-disc ps-4 text-micro">
                {r.crew.filter((c) => c.blocksEffective).map((c) => (
                  <li key={c.personId}><span className="font-medium">{c.name}</span> — {c.reasons.join("; ")}</li>
                ))}
              </ul>
              <div className="mt-1 text-micro opacity-80">Resolve or override on the full mission page.</div>
            </div>
          ) : (
            <div className="rounded-md bg-status-ok-bg px-3 py-2 text-small text-status-ok-fg">Crew gate clear — {r.crew.length} assigned.</div>
          )}
        </div>
      )}

      <div className="mt-3 border-t border-subtle pt-3">
        <span className="text-micro text-fg-muted">Activity{detail.notes.count ? ` · ${detail.notes.count} note${detail.notes.count === 1 ? "" : "s"}` : ""}</span>
        {detail.notes.latest ? (
          <div className="mt-1 text-small">
            <span className="text-fg-primary">{detail.notes.latest.body}</span>
            <span className="block text-micro text-fg-muted">{detail.notes.latest.author} · {detail.notes.latest.at.slice(0, 16).replace("T", " ")}</span>
          </div>
        ) : (
          <p className="mt-1 text-small text-fg-muted">No notes yet.</p>
        )}
      </div>

      {m.jurisdiction === "Oman" && (
        <div className="mt-3 flex flex-col gap-1 text-micro">
          <span className="text-fg-muted">Standing conditions</span>
          <span className="flex items-center justify-between"><span>Green-zone confirmation</span>{m.greenZoneConfirmedAt ? <span className="text-status-ok-fg">confirmed</span> : <span className="text-status-warn-fg">required</span>}</span>
          <span className="flex items-center justify-between"><span>Media-attribution</span><span className={m.mediaAttribution ? "text-status-ok-fg" : "text-fg-muted"}>{m.mediaAttribution ? "acknowledged" : "—"}</span></span>
        </div>
      )}
    </Drawer>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <span className="flex items-center justify-between border-t border-subtle py-2 text-small first:border-t-0">
      <span className="text-fg-muted">{k}</span>
      <span className={mono ? "font-mono tabular-nums text-fg-primary" : "text-fg-primary"}>{v}</span>
    </span>
  );
}
