"use client";

import Link from "next/link";
import {
  Button,
  Card,
  Input,
  Select,
  StatusPill,
  Timeline,
  type StatusVocab,
  type TimelineEvent,
} from "@dronops/ui";
import type { FindingDetail } from "@/server/compliance";
import { addCapaActionAction, transitionFindingAction } from "../actions";

type Ncr = StatusVocab["ncr"];
const asNcr = (s: string): Ncr => s as Ncr;
const fmtDate = (iso: string | null) => (iso ? iso.slice(0, 10) : "—");
const LIFECYCLE: { key: string; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "containment", label: "Containment" },
  { key: "capa-in-progress", label: "CAPA in progress" },
  { key: "verify", label: "Verify" },
  { key: "closed", label: "Closed" },
];
const ACTION_LABELS: Record<string, string> = {
  "finding.auto_raise": "Auto-raised",
  "finding.triage": "Triaged",
  "finding.transition": "Status changed",
  "capa_action.add": "CAPA action added",
};

function LevelBadge({ level }: { level: string }) {
  const cls = level === "major" ? "bg-status-danger-bg text-status-danger-fg" : level === "minor" ? "bg-status-warn-bg text-status-warn-fg" : "bg-status-neutral-bg text-status-neutral-fg";
  return <span className={`rounded px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${cls}`}>{level === "observation" ? "obs" : level}</span>;
}

export function FindingDetailView({
  detail,
  persons,
  history,
  canManage,
}: {
  detail: FindingDetail;
  persons: { id: string; name: string }[];
  history: TimelineEvent[];
  canManage: boolean;
}) {
  const f = detail.finding;
  const terminal = f.status === "closed" || f.status === "false-positive";
  const curIdx = LIFECYCLE.findIndex((s) => s.key === f.status);

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/compliance" className="text-micro text-fg-muted">← Findings</Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-display text-fg-primary">{f.title}</h1>
            <StatusPill domain="ncr" status={asNcr(f.status)} />
          </div>
          <div className="flex items-center gap-2 text-micro text-fg-muted">
            <span className="font-mono tabular-nums">{f.code}</span>
            {f.jurisdiction && <span>· {f.jurisdiction}</span>}
            <span>· {f.source === "flight_deviation" ? "auto-raised" : `raised by ${f.source}`}</span>
            <LevelBadge level={f.level} />
          </div>
        </div>
        {!terminal && canManage && (
          <div className="flex flex-wrap gap-2">
            {detail.transitions.map((t) => (
              <Button key={t.to} variant={t.verifies ? "primary" : "secondary"} onClick={() => act(transitionFindingAction, { findingId: f.id, to: t.to })}>
                {t.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {f.status !== "false-positive" && (
        <div className="flex flex-wrap items-center gap-2">
          {LIFECYCLE.map((s, i) => (
            <span key={s.key} className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 text-small ${i === curIdx ? "font-medium text-fg-primary" : i < curIdx ? "text-fg-secondary" : "text-fg-muted"}`}>
                <span className={`flex h-4 w-4 items-center justify-center rounded-pill text-[9px] ${i < curIdx ? "bg-accent text-[#052019]" : i === curIdx ? "border border-accent text-accent" : "border border-strong"}`}>{i < curIdx ? "✓" : i + 1}</span>
                {s.label}
              </span>
              {i < LIFECYCLE.length - 1 && <span className="text-fg-muted">›</span>}
            </span>
          ))}
        </div>
      )}

      {terminal && (
        <div className="rounded-md bg-status-neutral-bg px-4 py-2.5 text-small">
          <span className="font-medium text-fg-primary">Locked — {f.status === "false-positive" ? "false positive" : "closed"}.</span>{" "}
          <span className="text-fg-secondary">This finding is immutable (enforced in the database).</span>
          {f.triageReason && <span className="block text-micro text-fg-muted">Reason: {f.triageReason}</span>}
          {(f.verifiedBy || f.closedAt) && <span className="block text-micro text-fg-muted">{f.verifiedBy ? `Verified by ${f.verifiedBy} · ` : ""}{fmtDate(f.closedAt ?? f.triagedAt)}</span>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-4">
          <Card title="Detail">
            <p className="text-small text-fg-secondary">{f.description ?? f.title}</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <KV k="Source" v={f.source === "flight_deviation" ? `Flight ${f.sourceRef?.slice(0, 8) ?? ""} · ${f.deviationCode}` : f.source} />
              <KV k="Evidence" v={f.evidenceFileId ? "📎 sealed log attached" : "—"} />
              <KV k="CAPA due" v={fmtDate(f.dueAt)} mono />
              <KV k="Raised by" v={f.raisedBy ?? "system (auto)"} />
            </div>
          </Card>

          <Card title="CAPA actions">
            {detail.capa.length === 0 ? (
              <p className="text-small text-fg-muted">No actions yet.</p>
            ) : (
              <ul className="flex flex-col">
                {detail.capa.map((c) => (
                  <li key={c.id} className="flex items-center justify-between border-t border-subtle py-2 text-small first:border-t-0">
                    <span><span className="font-medium capitalize">{c.kind}</span> — {c.description}</span>
                    <span className="text-micro text-fg-muted">{c.owner ?? "—"}{c.dueAt ? ` · due ${fmtDate(c.dueAt)}` : ""}{c.completedAt ? " · done" : ""}</span>
                  </li>
                ))}
              </ul>
            )}
            {!terminal && canManage && (
              <form action={addCapaActionAction} className="mt-3 flex flex-wrap items-end gap-2 border-t border-subtle pt-3">
                <input type="hidden" name="findingId" value={f.id} />
                <label className="flex flex-col gap-1 text-small"><span className="text-fg-muted">Kind</span>
                  <Select name="kind" options={[{ value: "containment", label: "Containment" }, { value: "corrective", label: "Corrective" }, { value: "preventive", label: "Preventive" }]} />
                </label>
                <label className="flex flex-1 flex-col gap-1 text-small"><span className="text-fg-muted">Description</span><Input name="description" required /></label>
                <label className="flex flex-col gap-1 text-small"><span className="text-fg-muted">Owner</span><Select name="ownerPersonId" placeholder="—" options={persons.map((p) => ({ value: p.id, label: p.name }))} /></label>
                <label className="flex flex-col gap-1 text-small"><span className="text-fg-muted">Due</span><Input name="dueAt" type="date" /></label>
                <Button type="submit" variant="secondary">Add</Button>
              </form>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Close-out">
            <KV k="Raised by" v={f.raisedBy ?? "system (auto)"} />
            <div className="mt-2"><KV k="Verifier" v={f.verifiedBy ?? (terminal ? "—" : "set on verify")} /></div>
            {!terminal && (
              <div className="mt-3 rounded-md bg-status-danger-bg px-3 py-2 text-micro text-status-danger-fg">
                Segregation of duties — the raiser cannot verify this finding&apos;s closure. Enforced in the database, not the UI.
              </div>
            )}
          </Card>
          <Card title="History">
            {history.length ? <Timeline events={history.map((h) => ({ ...h, action: ACTION_LABELS[h.action] ?? h.action }))} /> : <p className="text-small text-fg-muted">No history yet.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}

function act(action: (fd: FormData) => Promise<void>, fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  action(fd);
}

function KV({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-micro text-fg-muted">{k}</span>
      <span className={`text-small text-fg-primary ${mono ? "font-mono tabular-nums" : ""}`}>{v}</span>
    </div>
  );
}
