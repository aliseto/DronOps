"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  SignatureBlock,
  SignatureCeremony,
  StatusPill,
  Textarea,
  Timeline,
  type TimelineEvent,
} from "@dronops/ui";
import type { ReviewDetail } from "@/server/management-review";
import { signReviewAction, updateReviewAction } from "../actions";

const fmt = (iso: string | null) => (iso ? iso.slice(0, 10) : "—");
const ACTIONS: Record<string, string> = {
  "management_review.create": "Created",
  "management_review.update": "Edited",
  "management_review.sign": "Signed",
};

function Metric({ n, l, tone }: { n: string | number; l: string; tone?: "bad" | "warn" }) {
  const c = tone === "bad" ? "text-status-danger-fg" : tone === "warn" ? "text-status-warn-fg" : "text-fg-primary";
  return (
    <div className="rounded-lg bg-bg-inset px-3 py-2.5">
      <div className={`font-mono text-xl font-bold tabular-nums leading-tight ${c}`}>{n}</div>
      <div className="mt-0.5 text-micro text-fg-muted">{l}</div>
    </div>
  );
}

export function ReviewDetailView({
  detail,
  canManage,
  canSign,
  history,
}: {
  detail: ReviewDetail;
  canManage: boolean;
  canSign: boolean;
  history: TimelineEvent[];
}) {
  const signed = detail.status === "signed";
  const editable = canManage && !signed;
  const [signOpen, setSignOpen] = useState(false);
  const i = detail.inputs;
  const meaning = `I have conducted the ISO 9.3 operational management review for ${detail.code} (${fmt(detail.periodStart)} → ${fmt(detail.periodEnd)}) and approve this record and its decisions.`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/compliance/reviews" className="text-micro text-fg-muted">← Management review</Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-display text-fg-primary">{detail.title ?? "Operational QMS review"}</h1>
            <StatusPill domain="document" status={signed ? "effective" : "draft"} />
          </div>
          <div className="flex items-center gap-2 text-micro text-fg-muted">
            <span className="font-mono tabular-nums">{detail.code}</span>
            <span>· ISO 9.3 · period <span className="font-mono">{fmt(detail.periodStart)} → {fmt(detail.periodEnd)}</span></span>
          </div>
        </div>
        {canSign && !signed && <Button variant="primary" onClick={() => setSignOpen(true)}>Re-auth &amp; sign</Button>}
      </div>

      {signed && (
        <div className="flex items-center gap-2 rounded-md bg-status-neutral-bg px-4 py-2.5 text-small">
          <span className="font-medium text-fg-primary">🔒 Signed &amp; immutable.</span>
          <span className="text-fg-secondary">Inputs were frozen at signing; revisions are a new review.</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="flex flex-col gap-4">
          <Card title={`Audit & coverage · nonconformities — ${signed ? "snapshot" : "pulled (live)"}`}>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <Metric n={i.coverage.pct == null ? "—" : `${i.coverage.pct}%`} l="Coverage" />
              <Metric n={i.coverage.gap} l="Coverage gaps" tone={i.coverage.gap ? "bad" : undefined} />
              <Metric n={i.findings.open} l="Open findings" tone={i.findings.open ? "warn" : undefined} />
              <Metric n={i.findings.overdue} l="Overdue" tone={i.findings.overdue ? "bad" : undefined} />
            </div>
            <p className="mt-2 text-micro text-fg-muted">
              Open by level: {i.findings.byLevel.major} major · {i.findings.byLevel.minor} minor · {i.findings.byLevel.observation} observation · raised this period: {i.findings.raisedInPeriod}
            </p>
          </Card>

          <Card title={`Operational performance — ${signed ? "snapshot" : "pulled (live)"}`}>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <Metric n={i.performance.missionsInPeriod.total} l="Missions (period)" />
              <Metric n={i.performance.deviationFindingsInPeriod} l="Deviation findings" tone={i.performance.deviationFindingsInPeriod ? "warn" : undefined} />
              <Metric n={`${i.performance.currency.crewTotal - i.performance.currency.blocked}/${i.performance.currency.crewTotal}`} l="Crew current" />
              <Metric n={`${i.performance.fleet.serviceable}/${i.performance.fleet.total}`} l="Aircraft serviceable" tone={i.performance.fleet.grounded ? "warn" : undefined} />
            </div>
            <p className="mt-2 text-micro text-fg-muted">
              Missions by status: {Object.entries(i.performance.missionsInPeriod.byStatus).map(([s, n]) => `${n} ${s}`).join(" · ") || "none"} · {i.performance.fleet.grounded} grounded · {i.performance.currency.crewWithExpiringCredentials} crew with credentials expiring ≤90 d
            </p>
          </Card>

          <Narrative editable={editable} reviewId={detail.id} detail={detail} />
        </div>

        <div className="flex flex-col gap-4">
          <OutputsCard editable={editable} reviewId={detail.id} value={detail.outputs} />
          {signed && detail.signature ? (
            <Card title="Sign-off">
              <SignatureBlock signerName={detail.signedBy ?? "Signer"} signedAtUtc={detail.signature.signedAtUtc} payloadHash={detail.signature.payloadHash} method={detail.signature.method as "password" | "passkey"} meaning={meaning} />
            </Card>
          ) : (
            <Card title="Sign-off — accountable manager">
              {canSign ? (
                <>
                  <p className="text-small text-fg-secondary">{meaning}</p>
                  <p className="mt-2 text-micro text-fg-muted">Signing freezes the pulled metrics into the record and makes it immutable.</p>
                  <div className="mt-3"><Button variant="primary" onClick={() => setSignOpen(true)}>Re-auth &amp; sign</Button></div>
                </>
              ) : (
                <p className="text-small text-fg-muted">The accountable manager signs this review.</p>
              )}
            </Card>
          )}
          <Card title="History">
            {history.length ? <Timeline events={history.map((h) => ({ ...h, action: ACTIONS[h.action] ?? h.action }))} /> : <p className="text-small text-fg-muted">No history yet.</p>}
          </Card>
        </div>
      </div>

      {canSign && !signed && (
        <SignatureCeremony open={signOpen} onClose={() => setSignOpen(false)} meaning={meaning} onSign={(proof) => signReviewAction(detail.id, meaning, proof)} />
      )}
    </div>
  );
}

const FIELDS: { key: keyof ReviewDetail; label: string; hint?: string }[] = [
  { key: "priorActions", label: "Prior-review action follow-up" },
  { key: "customerFeedback", label: "Customer feedback", hint: "safety / service signals only" },
  { key: "riskEffectiveness", label: "Risk / opportunity action effectiveness" },
  { key: "improvements", label: "Improvement opportunities" },
];

function Narrative({ editable, reviewId, detail }: { editable: boolean; reviewId: string; detail: ReviewDetail }) {
  return (
    <Card title="Narrative inputs §9.3.2">
      {editable ? (
        <form action={updateReviewAction} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={reviewId} />
          {FIELDS.map((f) => (
            <label key={f.key} className="flex flex-col gap-1 text-small">
              <span className="flex items-center gap-2 font-medium text-fg-secondary">{f.label}{f.hint && <span className="rounded bg-status-info-bg px-1.5 py-0.5 text-micro text-status-info-fg">{f.hint}</span>}</span>
              <Textarea name={f.key} rows={2} defaultValue={(detail[f.key] as string | null) ?? ""} />
            </label>
          ))}
          <div><Button type="submit" variant="secondary">Save draft</Button></div>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <div className="text-small font-medium text-fg-secondary">{f.label}</div>
              <p className="text-small text-fg-primary">{(detail[f.key] as string | null) || <span className="text-fg-muted">—</span>}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function OutputsCard({ editable, reviewId, value }: { editable: boolean; reviewId: string; value: string | null }) {
  return (
    <Card title="Review outputs §9.3.3">
      {editable ? (
        <form action={updateReviewAction} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={reviewId} />
          <Textarea name="outputs" rows={5} defaultValue={value ?? ""} placeholder="Decisions & actions: improvement, resource needs, changes to the QMS…" />
          <div><Button type="submit" variant="secondary">Save</Button></div>
        </form>
      ) : (
        <p className="whitespace-pre-wrap text-small text-fg-primary">{value || <span className="text-fg-muted">—</span>}</p>
      )}
    </Card>
  );
}
