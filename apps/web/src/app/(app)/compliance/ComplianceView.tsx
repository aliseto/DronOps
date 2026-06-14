"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Button,
  DataTable,
  Drawer,
  EmptyState,
  Input,
  StatusPill,
  Textarea,
  type Column,
  type StatusVocab,
} from "@dronops/ui";
import type { FindingDetail, FindingListItem } from "@/server/compliance";
import { triageFindingAction } from "./actions";

type Ncr = StatusVocab["ncr"];
const fmtDate = (iso: string | null) => (iso ? iso.slice(0, 10) : "—");
// DB status keys map 1:1 to the StatusPill `ncr` vocab.
const asNcr = (s: string): Ncr => s as Ncr;

function LevelBadge({ level }: { level: string }) {
  const tone = level === "major" ? "danger" : level === "minor" ? "warn" : "neutral";
  const cls = { danger: "bg-status-danger-bg text-status-danger-fg", warn: "bg-status-warn-bg text-status-warn-fg", neutral: "bg-status-neutral-bg text-status-neutral-fg" }[tone];
  return <span className={`rounded px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${cls}`}>{level === "observation" ? "obs" : level}</span>;
}

export function ComplianceView({
  findings,
  queueCount,
  openCount,
  detail,
  canTriage,
}: {
  findings: FindingListItem[];
  queueCount: number;
  openCount: number;
  detail: FindingDetail | null;
  canTriage: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [onlyQueue, setOnlyQueue] = useState(false);
  const open = (id: string) => router.push(`${pathname}?panel=finding:${id}`);
  const close = () => router.push(pathname);

  const rows = useMemo(() => {
    let r = findings;
    if (onlyQueue) r = r.filter((f) => f.untriaged);
    const n = q.trim().toLowerCase();
    if (n) r = r.filter((f) => f.title.toLowerCase().includes(n) || f.code.toLowerCase().includes(n));
    return r;
  }, [findings, q, onlyQueue]);

  const columns: Column<FindingListItem>[] = [
    { key: "code", header: "Ref", width: "0.7fr", accessor: (f) => f.code, sortable: true, cell: (f) => <span className="font-mono tabular-nums text-fg-secondary">{f.code}</span> },
    {
      key: "title",
      header: "Finding",
      width: "1.8fr",
      accessor: (f) => f.title,
      cell: (f) => (
        <span className="flex flex-col">
          <span className="font-medium text-fg-primary">{f.title}</span>
          <span className="text-micro text-fg-muted">{f.source === "flight_deviation" ? `auto · ${f.deviationCode}` : f.source}</span>
        </span>
      ),
    },
    { key: "level", header: "Level", width: "0.6fr", accessor: (f) => f.level, cell: (f) => <LevelBadge level={f.level} /> },
    {
      key: "status",
      header: "Status",
      width: "1fr",
      accessor: (f) => f.status,
      sortable: true,
      cell: (f) => (
        <span className="flex items-center gap-1.5">
          <StatusPill domain="ncr" status={asNcr(f.status)} />
          {f.untriaged && <span className="text-micro text-status-warn-fg">untriaged</span>}
        </span>
      ),
    },
    { key: "due", header: "CAPA due", width: "0.8fr", accessor: (f) => f.dueAt ?? "", cell: (f) => <span className="font-mono tabular-nums text-micro text-fg-muted">{fmtDate(f.dueAt)}</span> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-display text-fg-primary">Findings</h1>
        <p className="text-small text-fg-muted">
          Nonconformities &amp; corrective action. Deviations from sealed flights auto-raise here with evidence
          attached; triage, then drive CAPA to closure.
        </p>
      </div>

      {queueCount > 0 && (
        <button
          onClick={() => setOnlyQueue((v) => !v)}
          className={`flex items-center justify-between rounded-lg border px-4 py-2.5 text-start text-small ${onlyQueue ? "border-status-warn-fg bg-status-warn-bg" : "border-status-warn-fg/40 bg-status-warn-bg"} text-status-warn-fg`}
        >
          <span>
            <b>Triage queue</b> · <span className="font-mono tabular-nums">{queueCount}</span> auto-raised finding{queueCount === 1 ? "" : "s"} from sealed flights awaiting triage
          </span>
          <span className="font-medium">{onlyQueue ? "Show all" : "Review →"}</span>
        </button>
      )}

      <div className="flex items-center gap-3">
        <Input placeholder="Search findings…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <span className="text-micro text-fg-muted"><span className="font-mono tabular-nums">{openCount}</span> open</span>
      </div>

      <DataTable columns={columns} rows={rows} getRowId={(f) => f.id} onRowClick={(f) => open(f.id)} csvFileName="findings" empty={<EmptyState title="No findings" description="Sealed-flight deviations and audits raise findings here." />} />

      {detail && <FindingDrawer detail={detail} canTriage={canTriage} onClose={close} />}
    </div>
  );
}

function FindingDrawer({ detail, canTriage, onClose }: { detail: FindingDetail; canTriage: boolean; onClose: () => void }) {
  const f = detail.finding;
  const terminal = f.status === "closed" || f.status === "false-positive";
  return (
    <Drawer
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-3">
          <span>{f.title}</span>
          <StatusPill domain="ncr" status={asNcr(f.status)} />
        </span>
      }
      footer={
        <div className="flex items-center justify-between gap-2">
          <Link href={`/compliance/${f.id}`} className="text-small font-medium text-accent">Open full finding →</Link>
          {f.untriaged && <span className="text-micro text-status-warn-fg">awaiting triage</span>}
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-3 text-micro text-fg-muted">
        <span className="font-mono tabular-nums">{f.code}</span>
        {f.jurisdiction && <span>{f.jurisdiction}</span>}
        <LevelBadge level={f.level} />
      </div>

      {f.source === "flight_deviation" && (
        <div className="mb-3 rounded-md bg-status-info-bg px-3 py-2.5 text-small text-status-info-fg">
          <b>Auto-raised at seal</b> from flight <span className="font-mono">{f.sourceRef?.slice(0, 8)}</span>. Evidence:
          the sealed telemetry log is attached ({f.deviationCode}).
        </div>
      )}

      <div className="flex flex-col">
        <Row k="Source" v={f.source === "flight_deviation" ? `Flight deviation · ${f.deviationCode}` : f.source} />
        <Row k="CAPA due" v={fmtDate(f.dueAt)} mono />
        <Row k="Evidence" v={f.evidenceFileId ? "📎 attached" : "—"} mono />
        {f.raisedBy && <Row k="Raised by" v={f.raisedBy} />}
      </div>

      {/* Terminal states are immutable (enforce_finding_terminal) — UI shows it locked. */}
      {terminal ? (
        <div className="mt-3 rounded-md bg-status-neutral-bg px-3 py-2.5 text-small">
          <div className="font-medium text-fg-primary">Locked — {f.status === "false-positive" ? "false positive" : "closed"}</div>
          {f.triageReason && <div className="mt-1 text-micro text-fg-secondary">Reason: {f.triageReason}</div>}
          <div className="mt-1 text-micro text-fg-muted">
            {f.verifiedBy ? `Verified by ${f.verifiedBy} · ` : ""}{fmtDate(f.closedAt ?? f.triagedAt)} · immutable record.
          </div>
        </div>
      ) : f.untriaged && canTriage ? (
        <TriageForm findingId={f.id} />
      ) : f.untriaged ? (
        <p className="mt-3 text-small text-fg-muted">Triage requires a quality manager.</p>
      ) : null}
    </Drawer>
  );
}

function TriageForm({ findingId }: { findingId: string }) {
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const submit = (decision: "accept" | "downgrade" | "false-positive") => {
    if ((decision === "downgrade" || decision === "false-positive") && !reason.trim()) {
      setErr("A reason is required to downgrade or dismiss.");
      return;
    }
    const fd = new FormData();
    fd.set("findingId", findingId);
    fd.set("decision", decision);
    fd.set("reason", reason);
    triageFindingAction(fd);
  };
  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-subtle pt-3">
      <span className="text-micro text-fg-muted">Triage (reason logged; required to downgrade or dismiss):</span>
      <Textarea rows={2} value={reason} onChange={(e) => { setReason(e.target.value); setErr(""); }} placeholder="Reason for decision…" />
      {err && <span className="text-micro text-status-danger-fg">{err}</span>}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => submit("accept")}>Accept → NCR</Button>
        <Button variant="secondary" onClick={() => submit("downgrade")}>Downgrade to observation</Button>
        <Button variant="danger" onClick={() => submit("false-positive")}>False positive</Button>
      </div>
    </div>
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
