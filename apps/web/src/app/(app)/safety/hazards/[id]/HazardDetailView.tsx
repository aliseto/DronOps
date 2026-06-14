"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select, Textarea, Timeline, type TimelineEvent } from "@dronops/ui";
import { riskCell, SEVERITY_LABELS, LIKELIHOOD_LABELS } from "@dronops/shared";
import type { HazardDetail } from "@/server/hazards";
import { BandChip, RiskMatrix } from "../RiskMatrix";
import { reviewHazardAction, updateHazardAction } from "../actions";

const fmt = (iso: string | null) => (iso ? iso.slice(0, 10) : "—");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const ACTIONS: Record<string, string> = {
  "hazard.create": "Created",
  "hazard.from_deviation": "Opened from recurring deviation",
  "hazard.update": "Updated",
  "hazard.review": "Reviewed",
};
const REVIEW_TONE: Record<string, string> = {
  overdue: "text-status-danger-fg",
  "due-soon": "text-status-warn-fg",
  ok: "text-status-ok-fg",
  none: "text-fg-muted",
};

const SEV_OPTS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} · ${SEVERITY_LABELS[n]}` }));
const LIK_OPTS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} · ${LIKELIHOOD_LABELS[n]}` }));

function ScoreBlock({
  title,
  severity,
  likelihood,
  onSeverity,
  onLikelihood,
  editable,
}: {
  title: string;
  severity: number | null;
  likelihood: number | null;
  onSeverity: (n: number) => void;
  onLikelihood: (n: number) => void;
  editable: boolean;
}) {
  const cell = severity != null && likelihood != null ? riskCell(severity, likelihood) : null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between"><span className="text-small font-medium text-fg-secondary">{title}</span><BandChip band={cell?.band ?? null} score={cell?.score ?? null} /></div>
      <label className="flex flex-col gap-1 text-small"><span className="text-fg-muted">Severity</span><Select disabled={!editable} value={severity != null ? String(severity) : ""} onChange={(e) => onSeverity(Number(e.target.value))} placeholder="—" options={SEV_OPTS} /></label>
      <label className="flex flex-col gap-1 text-small"><span className="text-fg-muted">Likelihood</span><Select disabled={!editable} value={likelihood != null ? String(likelihood) : ""} onChange={(e) => onLikelihood(Number(e.target.value))} placeholder="—" options={LIK_OPTS} /></label>
    </div>
  );
}

export function HazardDetailView({
  detail,
  canManage,
  persons,
  history,
}: {
  detail: HazardDetail;
  canManage: boolean;
  persons: { id: string; name: string }[];
  history: TimelineEvent[];
}) {
  const router = useRouter();
  const [sev, setSev] = useState<number | null>(detail.severity);
  const [lik, setLik] = useState<number | null>(detail.likelihood);
  const [rSev, setRSev] = useState<number | null>(detail.residualSeverity);
  const [rLik, setRLik] = useState<number | null>(detail.residualLikelihood);
  const [mitigations, setMitigations] = useState(detail.mitigations ?? "");
  const [interval, setIntervalDays] = useState(detail.reviewIntervalDays?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await updateHazardAction(detail.id, {
        likelihood: lik ?? undefined,
        severity: sev ?? undefined,
        residualLikelihood: rLik ?? undefined,
        residualSeverity: rSev ?? undefined,
        mitigations,
        reviewIntervalDays: interval ? Number(interval) : undefined,
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function setMeta(patch: Parameters<typeof updateHazardAction>[1]) {
    await updateHazardAction(detail.id, patch);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/safety/hazards" className="text-micro text-fg-muted">← Hazard register</Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-display text-fg-primary">{detail.title}</h1>
          <BandChip band={detail.inherentBand} />
          {detail.residualBand && <span className="text-micro text-fg-muted">residual</span>}
          {detail.residualBand && <BandChip band={detail.residualBand} />}
        </div>
        <div className="flex items-center gap-2 text-micro text-fg-muted">
          <span className="font-mono tabular-nums">{detail.code}</span>
          <span>· {detail.category ? cap(detail.category) : "uncategorized"}</span>
          {detail.source === "recurring_deviation" && <span>· from deviation <span className="font-mono">{detail.sourceRef}</span></span>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-4">
          <Card title="Risk assessment — 5×5 matrix">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <ScoreBlock title="Inherent risk" severity={sev} likelihood={lik} onSeverity={setSev} onLikelihood={setLik} editable={canManage} />
              <div className="flex flex-col items-center gap-1">
                <RiskMatrix inherent={{ severity: sev, likelihood: lik }} residual={{ severity: rSev, likelihood: rLik }} onPick={canManage ? (s, l) => { setSev(s); setLik(l); } : undefined} />
                <span className="text-micro text-fg-muted">▣ inherent · ▢ residual</span>
              </div>
              <ScoreBlock title="Residual risk" severity={rSev} likelihood={rLik} onSeverity={setRSev} onLikelihood={setRLik} editable={canManage} />
            </div>
            <label className="mt-4 flex flex-col gap-1 text-small">
              <span className="font-medium text-fg-secondary">Mitigations</span>
              <Textarea rows={3} value={mitigations} onChange={(e) => setMitigations(e.target.value)} disabled={!canManage} placeholder="Controls that reduce likelihood and/or severity…" />
            </label>
            {canManage && (
              <div className="mt-3 flex items-center gap-3">
                <label className="flex items-center gap-2 text-small"><span className="text-fg-muted">Review every</span><Input type="number" value={interval} onChange={(e) => setIntervalDays(e.target.value)} className="w-20" /><span className="text-fg-muted">days</span></label>
                <Button variant="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save assessment"}</Button>
              </div>
            )}
          </Card>

          <Card title="Description">
            <p className="whitespace-pre-wrap text-small text-fg-primary">{detail.description || <span className="text-fg-muted">—</span>}</p>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Register entry">
            {canManage ? (
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1 text-small"><span className="text-fg-muted">Status</span>
                  <Select value={detail.status} onChange={(e) => setMeta({ status: e.target.value as "open" | "monitored" | "closed" })} options={[{ value: "open", label: "Open" }, { value: "monitored", label: "Monitored" }, { value: "closed", label: "Closed" }]} />
                </label>
                <label className="flex flex-col gap-1 text-small"><span className="text-fg-muted">Owner</span>
                  <Select value={detail.ownerPersonId ?? ""} onChange={(e) => setMeta({ ownerPersonId: e.target.value || null })} placeholder="Unassigned" options={persons.map((p) => ({ value: p.id, label: p.name }))} />
                </label>
              </div>
            ) : (
              <div className="flex flex-col gap-2 text-small">
                <div className="flex justify-between"><span className="text-fg-muted">Status</span><span className="text-fg-primary">{cap(detail.status)}</span></div>
                <div className="flex justify-between"><span className="text-fg-muted">Owner</span><span className="text-fg-primary">{detail.owner ?? "—"}</span></div>
              </div>
            )}
          </Card>

          <Card title="Review cycle">
            <div className="flex flex-col gap-1.5 text-small">
              <div className="flex justify-between"><span className="text-fg-muted">Status</span><span className={`font-medium ${REVIEW_TONE[detail.review]}`}>{detail.review === "none" ? "No cycle set" : cap(detail.review.replace("-", " "))}</span></div>
              <div className="flex justify-between"><span className="text-fg-muted">Last reviewed</span><span className="font-mono text-micro">{fmt(detail.lastReviewedAt)}</span></div>
              <div className="flex justify-between"><span className="text-fg-muted">Next review</span><span className="font-mono text-micro">{fmt(detail.nextReviewAt)}</span></div>
            </div>
            {canManage && <div className="mt-3"><Button variant="secondary" onClick={async () => { await reviewHazardAction(detail.id); router.refresh(); }} disabled={!detail.reviewIntervalDays}>Mark reviewed</Button></div>}
            {canManage && !detail.reviewIntervalDays && <p className="mt-2 text-micro text-fg-muted">Set a review interval above to enable the cycle.</p>}
          </Card>

          <Card title="History">
            {history.length ? <Timeline events={history.map((h) => ({ ...h, action: ACTIONS[h.action] ?? h.action }))} /> : <p className="text-small text-fg-muted">No history yet.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}
