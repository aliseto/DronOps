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
  Timeline,
  type Column,
  type StatusVocab,
  type TimelineEvent,
} from "@dronops/ui";
import {
  addAircraftAction,
  addComponentAction,
  logMaintenanceAction,
  setConditionAction,
} from "./actions";

type Asset = StatusVocab["asset"];
interface CodeLabel {
  code: string;
  label: string;
}
interface FleetRow {
  id: string;
  label: string;
  identifier: string | null;
  airframeClass: string;
  manufacturer: string | null;
  model: string | null;
  status: Asset;
  registrationStatus: string;
  registrationExpiresAt: string | null;
  nextMaintenanceDueAt: string | null;
  maintenanceOverdue: boolean;
  componentCount: number;
}
interface Detail {
  aircraft: {
    id: string;
    label: string;
    identifier: string | null;
    airframeClass: string;
    manufacturer: string | null;
    model: string | null;
    gacaClass: string | null;
    registrationNo: string | null;
    registrationJurisdiction: string | null;
    registrationExpiresAt: string | null;
    firmwareVersion: string | null;
    condition: string;
    conditionNote: string | null;
  };
  status: Asset;
  registration: { status: string; daysUntilExpiry: number | null; clause?: string };
  components: { id: string; kind: string; label: string; serialNo: string | null; firmwareVersion: string | null }[];
  maintenance: {
    id: string;
    type: string;
    performedAt: string;
    description: string;
    performedByName: string | null;
    nextDueAt: string | null;
  }[];
}
interface Vocab {
  airframeClasses: CodeLabel[];
  gacaClasses: CodeLabel[];
  componentKinds: CodeLabel[];
  maintenanceTypes: CodeLabel[];
  jurisdictions: string[];
}

const ASSET_ORDER: Asset[] = ["grounded", "due-soon", "in-maintenance", "operational"];
const fmtDate = (iso: string | null) => (iso ? iso.slice(0, 10) : "—");

export function FleetView({
  fleet,
  exceptions,
  canManage,
  vocab,
  detail,
  history,
}: {
  fleet: FleetRow[];
  exceptions: { grounded: number; dueSoon: number; overdue: number };
  canManage: boolean;
  vocab: Vocab;
  detail: Detail | null;
  history: TimelineEvent[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [adding, setAdding] = useState(false);

  const open = (id: string) => router.push(`${pathname}?panel=aircraft:${id}`);
  const close = () => router.push(pathname);
  const classLabel = (code: string) => vocab.airframeClasses.find((c) => c.code === code)?.label ?? code;

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return fleet.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (!needle) return true;
      return (
        a.label.toLowerCase().includes(needle) ||
        (a.identifier ?? "").toLowerCase().includes(needle) ||
        a.airframeClass.toLowerCase().includes(needle)
      );
    });
  }, [fleet, q, statusFilter]);

  const columns: Column<FleetRow>[] = [
    {
      key: "aircraft",
      header: "Aircraft",
      width: "1.6fr",
      accessor: (a) => a.label,
      sortable: true,
      cell: (a) => (
        <span className="flex flex-col">
          <span className="font-medium text-fg-primary">{a.label}</span>
          <span className="text-micro text-fg-muted font-mono tabular-nums">
            {[a.identifier, classLabel(a.airframeClass)].filter(Boolean).join(" · ")}
          </span>
        </span>
      ),
    },
    {
      key: "model",
      header: "Make / model",
      width: "1fr",
      cell: (a) => <span className="text-small text-fg-muted">{[a.manufacturer, a.model].filter(Boolean).join(" ") || "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      width: "1fr",
      accessor: (a) => ASSET_ORDER.indexOf(a.status),
      sortable: true,
      cell: (a) => <StatusPill domain="asset" status={a.status} />,
    },
    {
      key: "registration",
      header: "Registration",
      width: "0.9fr",
      accessor: (a) => a.registrationExpiresAt ?? "",
      sortable: true,
      cell: (a) =>
        a.registrationExpiresAt ? (
          <span className="text-small text-fg-muted font-mono tabular-nums">{fmtDate(a.registrationExpiresAt)}</span>
        ) : (
          <span className="text-micro text-fg-muted">untracked</span>
        ),
    },
    {
      key: "maintenance",
      header: "Next maint.",
      width: "0.9fr",
      accessor: (a) => a.nextMaintenanceDueAt ?? "",
      sortable: true,
      cell: (a) =>
        a.maintenanceOverdue ? (
          <span className="text-small text-status-danger-fg">overdue</span>
        ) : a.nextMaintenanceDueAt ? (
          <span className="text-small text-fg-muted font-mono tabular-nums">{fmtDate(a.nextMaintenanceDueAt)}</span>
        ) : (
          <span className="text-micro text-fg-muted">—</span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-display text-fg-primary">Fleet</h1>
          <p className="text-small text-fg-muted">
            Each aircraft binds one registration jurisdiction; status is derived live from condition + registration
            expiry. Maintenance is an append-only logbook.
          </p>
        </div>
        {canManage && (
          <Button variant="primary" onClick={() => setAdding((v) => !v)}>
            + Add aircraft
          </Button>
        )}
      </div>

      {(exceptions.grounded > 0 || exceptions.dueSoon > 0 || exceptions.overdue > 0) && (
        <div className="flex flex-wrap gap-2 text-small">
          {exceptions.grounded > 0 && (
            <span className="rounded-md bg-status-danger-bg px-3 py-1.5 text-status-danger-fg">
              <span className="font-mono tabular-nums">{exceptions.grounded}</span> grounded
            </span>
          )}
          {exceptions.dueSoon > 0 && (
            <span className="rounded-md bg-status-warn-bg px-3 py-1.5 text-status-warn-fg">
              <span className="font-mono tabular-nums">{exceptions.dueSoon}</span> registration due soon
            </span>
          )}
          {exceptions.overdue > 0 && (
            <span className="rounded-md bg-status-warn-bg px-3 py-1.5 text-status-warn-fg">
              <span className="font-mono tabular-nums">{exceptions.overdue}</span> maintenance overdue
            </span>
          )}
        </div>
      )}

      {adding && canManage && <AddAircraftForm vocab={vocab} onDone={() => setAdding(false)} />}

      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Search label, serial or class…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "all", label: "All status" },
            { value: "operational", label: "Operational" },
            { value: "due-soon", label: "Due soon" },
            { value: "in-maintenance", label: "In maintenance" },
            { value: "grounded", label: "Grounded" },
          ]}
        />
        <span className="text-micro text-fg-muted">
          {rows.length} of {fleet.length}
        </span>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(a) => a.id}
        onRowClick={(a) => open(a.id)}
        csvFileName="fleet"
        empty={<EmptyState title="No aircraft yet" description="Add an aircraft to start tracking the fleet." />}
      />

      {detail && (
        <AircraftDrawer detail={detail} history={history} canManage={canManage} vocab={vocab} onClose={close} />
      )}
    </div>
  );
}

function AddAircraftForm({ vocab, onDone }: { vocab: Vocab; onDone: () => void }) {
  return (
    <Card title="Add aircraft">
      <form action={addAircraftAction} className="grid grid-cols-2 gap-3 md:grid-cols-3" onSubmit={() => setTimeout(onDone, 0)}>
        <Field label="Label" required><Input name="label" required /></Field>
        <Field label="Serial / identifier"><Input name="identifier" /></Field>
        <Field label="Airframe class" required>
          <Select name="airframeClass" required options={vocab.airframeClasses.map((c) => ({ value: c.code, label: c.label }))} />
        </Field>
        <Field label="Manufacturer"><Input name="manufacturer" /></Field>
        <Field label="Model"><Input name="model" /></Field>
        <Field label="GACA class">
          <Select name="gacaClass" placeholder="—" options={vocab.gacaClasses.map((c) => ({ value: c.code, label: c.label }))} />
        </Field>
        <Field label="Registration no."><Input name="registrationNo" /></Field>
        <Field label="Reg. jurisdiction">
          <Select name="registrationJurisdiction" placeholder="—" options={vocab.jurisdictions.map((j) => ({ value: j, label: j }))} />
        </Field>
        <Field label="Reg. expires"><Input name="registrationExpiresAt" type="date" /></Field>
        <Field label="Firmware"><Input name="firmwareVersion" /></Field>
        <div className="col-span-2 flex items-end md:col-span-3">
          <Button type="submit" variant="primary">Add aircraft</Button>
        </div>
      </form>
    </Card>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-small">
      <span className="text-fg-muted">
        {label}
        {required && <span className="text-status-danger-fg"> *</span>}
      </span>
      {children}
    </label>
  );
}

function AircraftDrawer({
  detail,
  history,
  canManage,
  vocab,
  onClose,
}: {
  detail: Detail;
  history: TimelineEvent[];
  canManage: boolean;
  vocab: Vocab;
  onClose: () => void;
}) {
  const [tab, setTab] = useState("overview");
  const a = detail.aircraft;
  return (
    <Drawer
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-3">
          <span>{a.label}</span>
          <StatusPill domain="asset" status={detail.status} />
        </span>
      }
    >
      <div className="mb-3 flex flex-wrap gap-4 text-micro text-fg-muted">
        {a.identifier && <span className="font-mono tabular-nums">{a.identifier}</span>}
        <span>{[a.manufacturer, a.model].filter(Boolean).join(" ") || "—"}</span>
        <span>{vocab.airframeClasses.find((c) => c.code === a.airframeClass)?.label ?? a.airframeClass}</span>
      </div>
      <Tabs
        value={tab}
        onValueChange={setTab}
        items={[
          { value: "overview", label: "Overview" },
          { value: "components", label: "Components" },
          { value: "maintenance", label: "Maintenance" },
          { value: "history", label: "History" },
        ]}
      />
      {tab === "overview" && <OverviewTab detail={detail} canManage={canManage} />}
      {tab === "components" && <ComponentsTab detail={detail} canManage={canManage} vocab={vocab} />}
      {tab === "maintenance" && <MaintenanceTab detail={detail} canManage={canManage} vocab={vocab} />}
      {tab === "history" && (
        <div className="pt-3">
          {history.length ? <Timeline events={history} /> : <p className="text-small text-fg-muted">No history yet.</p>}
        </div>
      )}
    </Drawer>
  );
}

function OverviewTab({ detail, canManage }: { detail: Detail; canManage: boolean }) {
  const a = detail.aircraft;
  const reg = detail.registration;
  const regTone =
    reg.status === "lapsed" ? "text-status-danger-fg" : reg.status === "expiring" ? "text-status-warn-fg" : "text-fg-secondary";
  return (
    <div className="flex flex-col gap-3 pt-3">
      <div className="grid grid-cols-2 gap-3">
        <KV k="Registration no." v={a.registrationNo ?? "—"} />
        <KV k="Jurisdiction" v={a.registrationJurisdiction ?? "—"} />
        <KV
          k="Registration expiry"
          v={
            a.registrationExpiresAt ? (
              <span className={regTone}>
                {a.registrationExpiresAt.slice(0, 10)}
                {reg.daysUntilExpiry != null && (
                  <span className="text-micro text-fg-muted"> ({reg.daysUntilExpiry} d)</span>
                )}
              </span>
            ) : (
              "untracked"
            )
          }
        />
        <KV k="Reg. gate" v={reg.clause ?? "—"} />
        <KV k="GACA class" v={a.gacaClass ?? "—"} />
        <KV k="Firmware" v={a.firmwareVersion ?? "—"} />
      </div>
      {a.conditionNote && (
        <p className="rounded-md border border-default px-3 py-2 text-micro text-fg-muted">{a.conditionNote}</p>
      )}
      {canManage && (
        <Card title="Set condition">
          <form action={setConditionAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="aircraftId" value={a.id} />
            <label className="flex flex-col gap-1 text-small">
              <span className="text-fg-muted">Condition</span>
              <Select
                name="condition"
                defaultValue={a.condition}
                options={[
                  { value: "operational", label: "Operational" },
                  { value: "in_maintenance", label: "In maintenance" },
                  { value: "grounded", label: "Grounded" },
                ]}
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-small">
              <span className="text-fg-muted">Note</span>
              <Input name="note" defaultValue={a.conditionNote ?? ""} />
            </label>
            <Button type="submit" variant="primary">Save</Button>
          </form>
        </Card>
      )}
    </div>
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

function ComponentsTab({ detail, canManage, vocab }: { detail: Detail; canManage: boolean; vocab: Vocab }) {
  const kindLabel = (code: string) => vocab.componentKinds.find((c) => c.code === code)?.label ?? code;
  return (
    <div className="flex flex-col gap-4 pt-3">
      {detail.components.length === 0 ? (
        <EmptyState title="No components" description="Register the GCS, payloads and batteries used with this aircraft." />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {detail.components.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-md border border-default px-3 py-2 text-small">
              <span className="flex flex-col">
                <span className="text-fg-primary">{c.label}</span>
                <span className="text-micro text-fg-muted font-mono tabular-nums">
                  {[kindLabel(c.kind), c.serialNo, c.firmwareVersion].filter(Boolean).join(" · ")}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {canManage && (
        <Card title="Add component">
          <form action={addComponentAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="aircraftId" value={detail.aircraft.id} />
            <label className="flex flex-col gap-1 text-small">
              <span className="text-fg-muted">Kind</span>
              <Select name="kind" options={vocab.componentKinds.map((c) => ({ value: c.code, label: c.label }))} />
            </label>
            <label className="flex flex-col gap-1 text-small">
              <span className="text-fg-muted">Label</span>
              <Input name="label" required />
            </label>
            <label className="flex flex-col gap-1 text-small">
              <span className="text-fg-muted">Serial</span>
              <Input name="serialNo" />
            </label>
            <label className="flex flex-col gap-1 text-small">
              <span className="text-fg-muted">Firmware</span>
              <Input name="firmwareVersion" />
            </label>
            <Button type="submit" variant="primary">Add</Button>
          </form>
        </Card>
      )}
    </div>
  );
}

function MaintenanceTab({ detail, canManage, vocab }: { detail: Detail; canManage: boolean; vocab: Vocab }) {
  const typeLabel = (code: string) => vocab.maintenanceTypes.find((t) => t.code === code)?.label ?? code;
  return (
    <div className="flex flex-col gap-4 pt-3">
      <p className="text-micro text-fg-muted">Logbook is append-only — corrections are new entries (AC 107-01 schema).</p>
      {detail.maintenance.length === 0 ? (
        <EmptyState title="No maintenance records" description="Log inspections, repairs and firmware updates." />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {detail.maintenance.map((m) => (
            <li key={m.id} className="rounded-md border border-default px-3 py-2 text-small">
              <div className="flex items-center justify-between">
                <span className="text-fg-primary">{typeLabel(m.type)}</span>
                <span className="text-micro text-fg-muted font-mono tabular-nums">{m.performedAt.slice(0, 10)}</span>
              </div>
              <p className="text-micro text-fg-muted">{m.description}</p>
              <p className="text-micro text-fg-muted">
                {[m.performedByName, m.nextDueAt ? `next due ${m.nextDueAt.slice(0, 10)}` : null].filter(Boolean).join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      )}
      {canManage && (
        <Card title="Log maintenance">
          <form action={logMaintenanceAction} className="grid grid-cols-2 gap-3">
            <input type="hidden" name="aircraftId" value={detail.aircraft.id} />
            <Field label="Type">
              <Select name="type" options={vocab.maintenanceTypes.map((t) => ({ value: t.code, label: t.label }))} />
            </Field>
            <Field label="Performed at" required><Input name="performedAt" type="date" required /></Field>
            <Field label="Performed by"><Input name="performedByName" /></Field>
            <Field label="Next due"><Input name="nextDueAt" type="date" /></Field>
            <label className="col-span-2 flex flex-col gap-1 text-small">
              <span className="text-fg-muted">Description *</span>
              <Input name="description" required />
            </label>
            <div className="col-span-2">
              <Button type="submit" variant="primary">Log entry</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
