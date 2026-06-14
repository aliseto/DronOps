"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, JurisdictionBadge, Select, StatusPill, Textarea, Timeline, type TimelineEvent } from "@dronops/ui";
import type { OccurrenceDetail } from "@/server/safety";
import { DeadlineChip, deadlineState } from "../DeadlineChip";
import { escalateAction, markReportedAction, transitionOccurrenceAction, updateOccurrenceAction } from "../actions";

const fmt = (iso: string | null) => (iso ? iso.slice(0, 10) : "—");
const fmtTs = (iso: string | null) => (iso ? iso.replace("T", " ").slice(0, 16) + " UTC" : "—");
const CLASS_LABEL: Record<string, string> = { incident: "Incident", accident: "Accident", hazard_observation: "Hazard observation" };
const ACTIONS: Record<string, string> = {
  "occurrence.file": "Filed",
  "occurrence.update": "Investigation updated",
  "occurrence.report_to_regulator": "Reported to regulator",
  "occurrence.transition": "Status changed",
  "occurrence.close": "Closed",
  "occurrence.escalate_to_finding": "Escalated to finding",
};
const pillStatus = (s: string): "open" | "capa-in-progress" | "closed" => (s === "closed" ? "closed" : s === "investigating" ? "capa-in-progress" : "open");

function Link2({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-subtle py-1.5 text-small last:border-0">
      <span className="text-fg-muted">{label}</span>
      <span className="text-fg-primary">{value}</span>
    </div>
  );
}

export function OccurrenceDetailView({
  detail,
  canManage,
  canEscalate,
  history,
}: {
  detail: OccurrenceDetail;
  canManage: boolean;
  canEscalate: boolean;
  history: TimelineEvent[];
}) {
  const router = useRouter();
  const closed = detail.status === "closed";
  const editable = canManage && !closed;
  const [level, setLevel] = useState<"major" | "minor" | "observation">("minor");
  const d = detail.deadline;
  const ds = deadlineState(d);

  const go = (fn: () => Promise<unknown>) => async () => {
    await fn();
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/safety" className="text-micro text-fg-muted">← Safety occurrences</Link>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-display text-fg-primary">{detail.title}</h1>
            <StatusPill domain="ncr" status={pillStatus(detail.status)} />
            {detail.escalatedFindingCode && (
              <Link href={`/compliance/${detail.escalatedFindingId}`} className="rounded bg-status-info-bg px-2 py-0.5 text-micro font-medium text-status-info-fg">→ {detail.escalatedFindingCode}</Link>
            )}
          </div>
          <div className="flex items-center gap-2 text-micro text-fg-muted">
            <span className="font-mono tabular-nums">{detail.code}</span>
            <span>· {CLASS_LABEL[detail.classification]}</span>
            <JurisdictionBadge jurisdiction={detail.jurisdiction} />
            <span>· occurred <span className="font-mono">{fmtTs(detail.occurredAt)}</span></span>
          </div>
        </div>
        {d.applicable && (
          <Link href={`/print/occurrences/${detail.id}`} target="_blank" className="rounded-md border border-strong px-3 py-1.5 text-small text-fg-secondary hover:border-accent">
            Export regulator report ↗
          </Link>
        )}
      </div>

      {/* Reporting-deadline banner — the headline. */}
      {d.applicable ? (
        <div className={`flex flex-wrap items-center justify-between gap-3 rounded-md px-4 py-3 ${ds.tone === "danger" ? "bg-status-danger-bg" : ds.tone === "warn" ? "bg-status-warn-bg" : "bg-status-ok-bg"}`}>
          <div className="flex items-center gap-3">
            <DeadlineChip deadline={d} className="text-body" />
            <div className="text-small text-fg-secondary">
              {d.satisfied ? (
                <>Reported to the regulator on <span className="font-mono">{fmtTs(detail.reportedToRegulatorAt)}</span>.</>
              ) : d.immediate ? (
                <>Accidents must be reported <span className="font-medium">immediately</span> — {d.contacts}. Clause {d.clause}.</>
              ) : (
                <>Regulator notification due by <span className="font-mono">{fmtTs(d.dueAt)}</span> · clause {d.clause}.{d.listed && <> Listed incidents: by <span className="font-mono">{fmt(d.listed.dueAt)}</span>.</>}</>
              )}
            </div>
          </div>
          {editable && !d.satisfied && (
            <Button variant="primary" onClick={go(() => markReportedAction(detail.id))}>Mark reported to regulator</Button>
          )}
        </div>
      ) : (
        <div className="rounded-md bg-status-neutral-bg px-4 py-2.5 text-small text-fg-secondary">Hazard observation — internal record, no external reporting clock.</div>
      )}

      {closed && (
        <div className="flex items-center gap-2 rounded-md bg-status-neutral-bg px-4 py-2.5 text-small">
          <span className="font-medium text-fg-primary">🔒 Closed &amp; immutable.</span>
          <span className="text-fg-secondary">Closed {fmtTs(detail.closedAt)}{detail.closedBy ? ` by ${detail.closedBy}` : ""}; corrections are a new occurrence.</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="flex flex-col gap-4">
          <Card title="What happened">
            <p className="whitespace-pre-wrap text-small text-fg-primary">{detail.description || <span className="text-fg-muted">—</span>}</p>
          </Card>

          <Card title="Investigation">
            {editable ? (
              <form action={updateOccurrenceAction} className="flex flex-col gap-3">
                <input type="hidden" name="id" value={detail.id} />
                <label className="flex flex-col gap-1 text-small"><span className="font-medium text-fg-secondary">Investigation summary</span><Textarea name="investigationSummary" rows={3} defaultValue={detail.investigationSummary ?? ""} /></label>
                <label className="flex flex-col gap-1 text-small"><span className="font-medium text-fg-secondary">Root cause</span><Textarea name="rootCause" rows={2} defaultValue={detail.rootCause ?? ""} /></label>
                <div><Button type="submit" variant="secondary">Save investigation</Button></div>
              </form>
            ) : (
              <div className="flex flex-col gap-3 text-small">
                <div><div className="font-medium text-fg-secondary">Investigation summary</div><p className="whitespace-pre-wrap text-fg-primary">{detail.investigationSummary || <span className="text-fg-muted">—</span>}</p></div>
                <div><div className="font-medium text-fg-secondary">Root cause</div><p className="whitespace-pre-wrap text-fg-primary">{detail.rootCause || <span className="text-fg-muted">—</span>}</p></div>
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Linked records">
            <Link2 label="Mission" value={detail.missionCode ? <Link href={`/operations/${detail.missionId}`} className="font-mono text-accent">{detail.missionCode}</Link> : "—"} />
            <Link2 label="Flight log" value={detail.flightRecordId ? <Link href="/evidence" className="font-mono text-accent">linked</Link> : "—"} />
            <Link2 label="Aircraft" value={detail.aircraftLabel ?? "—"} />
            <Link2 label="Pilot" value={detail.pilotName ?? "—"} />
            <Link2 label="Reported by" value={detail.reportedBy ?? "—"} />
            <Link2 label="Filed" value={<span className="font-mono text-micro">{fmtTs(detail.reportedAt)}</span>} />
          </Card>

          {/* Investigation lifecycle + escalation. */}
          {canManage && !closed && (
            <Card title="Actions">
              <div className="flex flex-col gap-3">
                {detail.status === "open" && <Button variant="secondary" onClick={go(() => transitionOccurrenceAction(detail.id, "investigating"))}>Open investigation</Button>}
                {detail.status === "investigating" && (
                  <>
                    {canEscalate && !detail.escalatedFindingId && (
                      <div className="flex items-end gap-2">
                        <label className="flex flex-1 flex-col gap-1 text-small"><span className="text-fg-muted">Escalate as</span>
                          <Select value={level} onChange={(e) => setLevel(e.target.value as typeof level)} options={[{ value: "major", label: "Major NCR" }, { value: "minor", label: "Minor NCR" }, { value: "observation", label: "Observation" }]} />
                        </label>
                        <Button variant="secondary" onClick={go(() => escalateAction(detail.id, level))}>Escalate → finding</Button>
                      </div>
                    )}
                    <Button variant="primary" onClick={go(() => transitionOccurrenceAction(detail.id, "closed"))}>Close occurrence</Button>
                    <p className="text-micro text-fg-muted">Closing seals the record (immutable). Systemic causes should escalate to an NCR/CAPA first.</p>
                  </>
                )}
              </div>
            </Card>
          )}

          <Card title="History">
            {history.length ? <Timeline events={history.map((h) => ({ ...h, action: ACTIONS[h.action] ?? h.action }))} /> : <p className="text-small text-fg-muted">No history yet.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}
