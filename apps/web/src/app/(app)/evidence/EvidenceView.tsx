"use client";

import { useMemo, useState } from "react";
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
  Tabs,
  Textarea,
  Timeline,
  type Column,
  type StatusVocab,
  type TimelineEvent,
} from "@dronops/ui";
import { ingestFlightAction, reconcileFlightAction, sealFlightAction } from "./actions";

interface FlightRow {
  id: string;
  aircraftLabel: string;
  flownAt: string;
  durationSec: number | null;
  maxAltitudeM: number | null;
  status: string;
  deviationCount: number;
}
interface Deviation {
  code: string;
  detail: string;
  severity: string;
  clause?: string;
}
interface Detail {
  flight: {
    id: string;
    aircraftLabel: string;
    pilotName: string | null;
    jurisdiction: string | null;
    flownAt: string;
    durationSec: number | null;
    blockTimeSec: number | null;
    maxAltitudeM: number | null;
    maxDistanceM: number | null;
    minBatteryPct: number | null;
    sampleCount: number | null;
    ceilingM: number | null;
    status: string;
    source: string;
    evidenceFileId: string | null;
  };
  deviations: Deviation[];
}
interface Opt {
  id: string;
  label?: string;
  name?: string;
}

const STATUS_MAP: Record<string, StatusVocab["mission"]> = {
  draft: "draft",
  reconciled: "reconciling",
  sealed: "sealed",
};
const fmtDur = (s: number | null) => (s == null ? "—" : `${Math.floor(s / 60)}m ${s % 60}s`);
const fmtDate = (iso: string) => iso.slice(0, 16).replace("T", " ");

export function EvidenceView({
  flights,
  exceptions,
  canManage,
  aircraftOptions,
  persons,
  jurisdictions,
  detail,
  history,
}: {
  flights: FlightRow[];
  exceptions: { withDeviations: number; unsealed: number };
  canManage: boolean;
  aircraftOptions: Opt[];
  persons: Opt[];
  jurisdictions: string[];
  detail: Detail | null;
  history: TimelineEvent[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [ingesting, setIngesting] = useState(false);

  const open = (id: string) => router.push(`${pathname}?panel=flight:${id}`);
  const close = () => router.push(pathname);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return flights;
    return flights.filter((f) => f.aircraftLabel.toLowerCase().includes(needle));
  }, [flights, q]);

  const columns: Column<FlightRow>[] = [
    {
      key: "aircraft",
      header: "Aircraft",
      width: "1.2fr",
      accessor: (f) => f.aircraftLabel,
      sortable: true,
      cell: (f) => <span className="font-medium text-fg-primary">{f.aircraftLabel}</span>,
    },
    {
      key: "flownAt",
      header: "Flown",
      width: "1fr",
      accessor: (f) => f.flownAt,
      sortable: true,
      cell: (f) => <span className="text-small text-fg-muted font-mono tabular-nums">{fmtDate(f.flownAt)}</span>,
    },
    {
      key: "duration",
      header: "Duration",
      width: "0.7fr",
      accessor: (f) => f.durationSec ?? 0,
      cell: (f) => <span className="text-small text-fg-muted font-mono tabular-nums">{fmtDur(f.durationSec)}</span>,
    },
    {
      key: "maxAlt",
      header: "Max alt",
      width: "0.6fr",
      accessor: (f) => f.maxAltitudeM ?? 0,
      sortable: true,
      cell: (f) => <span className="text-small text-fg-muted font-mono tabular-nums">{f.maxAltitudeM != null ? `${Math.round(f.maxAltitudeM)} m` : "—"}</span>,
    },
    {
      key: "deviations",
      header: "Deviations",
      width: "0.8fr",
      accessor: (f) => f.deviationCount,
      sortable: true,
      cell: (f) =>
        f.deviationCount > 0 ? (
          <span className="text-small text-status-danger-fg font-mono tabular-nums">{f.deviationCount}</span>
        ) : (
          <span className="text-small text-status-ok-fg">clean</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      width: "0.8fr",
      accessor: (f) => f.status,
      sortable: true,
      cell: (f) => <StatusPill domain="mission" status={STATUS_MAP[f.status] ?? "draft"} />,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-display text-fg-primary">Flight evidence</h1>
          <p className="text-small text-fg-muted">
            Every flight audits itself — telemetry-derived metrics and deviations are computed on ingest and
            captured at reconcile. Sealed records are immutable.
          </p>
        </div>
        {canManage && (
          <Button variant="primary" onClick={() => setIngesting((v) => !v)}>
            + Ingest flight log
          </Button>
        )}
      </div>

      {(exceptions.withDeviations > 0 || exceptions.unsealed > 0) && (
        <div className="flex flex-wrap gap-2 text-small">
          {exceptions.withDeviations > 0 && (
            <span className="rounded-md bg-status-danger-bg px-3 py-1.5 text-status-danger-fg">
              <span className="font-mono tabular-nums">{exceptions.withDeviations}</span> with deviations
            </span>
          )}
          {exceptions.unsealed > 0 && (
            <span className="rounded-md bg-status-warn-bg px-3 py-1.5 text-status-warn-fg">
              <span className="font-mono tabular-nums">{exceptions.unsealed}</span> not yet sealed
            </span>
          )}
        </div>
      )}

      {ingesting && canManage && (
        <Card title="Ingest flight log (CSV)">
          <form action={ingestFlightAction} className="flex flex-col gap-3" onSubmit={() => setTimeout(() => setIngesting(false), 0)}>
            <div className="flex flex-wrap gap-3">
              <label className="flex flex-col gap-1 text-small">
                <span className="text-fg-muted">Aircraft *</span>
                <Select name="aircraftId" required options={aircraftOptions.map((a) => ({ value: a.id, label: a.label ?? a.id }))} />
              </label>
              <label className="flex flex-col gap-1 text-small">
                <span className="text-fg-muted">Pilot</span>
                <Select name="pilotPersonId" placeholder="—" options={persons.map((p) => ({ value: p.id, label: p.name ?? p.id }))} />
              </label>
              <label className="flex flex-col gap-1 text-small">
                <span className="text-fg-muted">Jurisdiction</span>
                <Select name="jurisdiction" placeholder="—" options={jurisdictions.map((j) => ({ value: j, label: j }))} />
              </label>
              <label className="flex flex-col gap-1 text-small">
                <span className="text-fg-muted">File name</span>
                <Input name="fileName" placeholder="flight-2026-06-01.csv" />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-small">
              <span className="text-fg-muted">
                CSV telemetry (DJI flight-record / Airdata export) — columns: time, latitude, longitude,
                altitude_m, battery_pct, in_air
              </span>
              <Textarea name="csvText" rows={6} required placeholder="time,latitude,longitude,altitude_m,battery_pct,in_air&#10;..." />
            </label>
            <p className="text-micro text-fg-muted">
              Encrypted DJI .DAT import is pending validation against real logs — use the CSV export for now.
            </p>
            <div>
              <Button type="submit" variant="primary">Ingest</Button>
            </div>
          </form>
        </Card>
      )}

      <Input placeholder="Search aircraft…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(f) => f.id}
        onRowClick={(f) => open(f.id)}
        csvFileName="flight-evidence"
        empty={<EmptyState title="No flights yet" description="Ingest a flight log to build the evidence record." />}
      />

      {detail && (
        <FlightDrawer
          detail={detail}
          history={history}
          canManage={canManage}
          persons={persons}
          jurisdictions={jurisdictions}
          onClose={close}
        />
      )}
    </div>
  );
}

function FlightDrawer({
  detail,
  history,
  canManage,
  persons,
  jurisdictions,
  onClose,
}: {
  detail: Detail;
  history: TimelineEvent[];
  canManage: boolean;
  persons: Opt[];
  jurisdictions: string[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState("overview");
  const f = detail.flight;
  const [sealing, setSealing] = useState(false);
  return (
    <Drawer
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-3">
          <span>{f.aircraftLabel}</span>
          <StatusPill domain="mission" status={STATUS_MAP[f.status] ?? "draft"} />
          <span className="text-micro text-fg-muted font-mono">{fmtDate(f.flownAt)}</span>
        </span>
      }
    >
      <Tabs
        value={tab}
        onValueChange={setTab}
        items={[
          { value: "overview", label: "Telemetry" },
          { value: "deviations", label: `Deviations${detail.deviations.length ? ` (${detail.deviations.length})` : ""}` },
          { value: "history", label: "History" },
        ]}
      />

      {tab === "overview" && (
        <div className="flex flex-col gap-3 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <KV k="Duration" v={fmtDur(f.durationSec)} />
            <KV k="Block time" v={fmtDur(f.blockTimeSec)} />
            <KV k="Max altitude" v={f.maxAltitudeM != null ? `${Math.round(f.maxAltitudeM)} m` : "—"} />
            <KV k="Max distance" v={f.maxDistanceM != null ? `${Math.round(f.maxDistanceM)} m` : "—"} />
            <KV k="Min battery" v={f.minBatteryPct != null ? `${f.minBatteryPct}%` : "—"} />
            <KV k="Samples" v={f.sampleCount ?? "—"} />
            <KV k="Pilot" v={f.pilotName ?? "—"} />
            <KV k="Jurisdiction" v={f.jurisdiction ?? "—"} />
            <KV k="Ceiling applied" v={f.ceilingM != null ? `${f.ceilingM} m` : "—"} />
            <KV k="Source" v={f.source} />
          </div>
          <p className="text-micro text-fg-muted">
            Recency &amp; duty block-time wiring into M7 stays “awaiting M6” until the parser is validated against
            real DJI logs.
          </p>

          {canManage && f.status === "draft" && (
            <Card title="Reconcile">
              <form action={reconcileFlightAction} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="flightId" value={f.id} />
                <label className="flex flex-col gap-1 text-small">
                  <span className="text-fg-muted">Jurisdiction</span>
                  <Select name="jurisdiction" defaultValue={f.jurisdiction ?? ""} placeholder="—" options={jurisdictions.map((j) => ({ value: j, label: j }))} />
                </label>
                <label className="flex flex-col gap-1 text-small">
                  <span className="text-fg-muted">Pilot</span>
                  <Select name="pilotPersonId" placeholder="—" options={persons.map((p) => ({ value: p.id, label: p.name ?? p.id }))} />
                </label>
                <label className="flex flex-col gap-1 text-small">
                  <span className="text-fg-muted">Ceiling override (m)</span>
                  <Input name="ceilingOverrideM" type="number" min={0} className="w-32" />
                </label>
                <Button type="submit" variant="primary">Reconcile &amp; compute deviations</Button>
              </form>
            </Card>
          )}

          {canManage && f.status === "reconciled" && (
            <div className="flex items-center gap-2">
              {sealing ? (
                <>
                  <span className="text-small text-fg-muted">Seal makes this record immutable. Confirm?</span>
                  <Button variant="danger" onClick={() => sealFlightAction(f.id)}>Seal</Button>
                  <Button variant="ghost" onClick={() => setSealing(false)}>Cancel</Button>
                </>
              ) : (
                <Button variant="secondary" onClick={() => setSealing(true)}>Seal record</Button>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "deviations" && (
        <div className="flex flex-col gap-2 pt-3">
          {f.status === "draft" && (
            <p className="text-small text-fg-muted">Reconcile the flight to compute deviations.</p>
          )}
          {detail.deviations.length === 0 ? (
            f.status !== "draft" && (
              <EmptyState variant="good" title="No deviations" description="This flight is within all evaluated limits." />
            )
          ) : (
            <ul className="flex flex-col gap-1.5">
              {detail.deviations.map((d, i) => (
                <li
                  key={i}
                  className={`rounded-md px-3 py-2 text-small ${d.severity === "high" ? "bg-status-danger-bg text-status-danger-fg" : "bg-status-warn-bg text-status-warn-fg"}`}
                >
                  <div className="font-medium">{d.detail}</div>
                  <div className="text-micro opacity-80">
                    {d.code}
                    {d.clause ? ` · ${d.clause}` : ""} · auto-raise to NCR/CAPA lands with M2/M3
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="pt-3">
          {history.length ? <Timeline events={history} /> : <p className="text-small text-fg-muted">No history yet.</p>}
        </div>
      )}
    </Drawer>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-micro text-fg-muted">{k}</span>
      <span className="text-small text-fg-primary font-mono tabular-nums">{v}</span>
    </div>
  );
}
