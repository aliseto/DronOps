"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Checkbox,
  SignatureBlock,
  SignatureCeremony,
  StatusPill,
  Textarea,
  Timeline,
  type TimelineEvent,
} from "@dronops/ui";
import type { AuditPackDetail, PackCandidates } from "@/server/audit-pack";
import { sealPackAction, updatePackAction } from "../actions";

const fmt = (iso: string | null) => (iso ? iso.slice(0, 10) : "—");
const ACTIONS: Record<string, string> = {
  "audit_pack.create": "Created",
  "audit_pack.update": "Edited",
  "audit_pack.seal": "Sealed",
};

function Metric({ n, l }: { n: string | number; l: string }) {
  return (
    <div className="rounded-lg bg-bg-inset px-3 py-2.5">
      <div className="font-mono text-xl font-bold tabular-nums leading-tight text-fg-primary">{n}</div>
      <div className="mt-0.5 text-micro text-fg-muted">{l}</div>
    </div>
  );
}

export function PackBuilderView({
  detail,
  candidates,
  canManage,
  history,
}: {
  detail: AuditPackDetail;
  candidates: PackCandidates | null;
  canManage: boolean;
  history: TimelineEvent[];
}) {
  const router = useRouter();
  const sealed = detail.status === "sealed";
  const editable = canManage && !sealed && candidates != null;
  const [sealOpen, setSealOpen] = useState(false);

  // Local selection mirror (draft only); persisted with the Save button.
  const [frameworks, setFrameworks] = useState<string[]>(detail.frameworks);
  const [findingIds, setFindingIds] = useState<string[]>(detail.selection.findingIds);
  const [documentIds, setDocumentIds] = useState<string[]>(detail.selection.documentIds);
  const [reviewIds, setReviewIds] = useState<string[]>(detail.selection.reviewIds);
  const [scopeNotes, setScopeNotes] = useState(detail.scopeNotes ?? "");
  const [saving, setSaving] = useState(false);

  const toggle = (arr: string[], set: (v: string[]) => void, id: string) =>
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  async function save() {
    setSaving(true);
    try {
      await updatePackAction(detail.id, {
        scopeNotes,
        frameworks,
        selection: { findingIds, documentIds, reviewIds },
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const snap = detail.snapshot;
  const meaning = `I have assembled audit pack ${detail.code} (${fmt(detail.periodStart)} → ${fmt(detail.periodEnd)}) for ${frameworks.length} framework(s) and seal this evidence bundle as a true, point-in-time record.`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/compliance/packs" className="text-micro text-fg-muted">← Audit packs</Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-display text-fg-primary">{detail.title ?? "Compliance evidence pack"}</h1>
            <StatusPill domain="document" status={sealed ? "effective" : "draft"} />
          </div>
          <div className="flex items-center gap-2 text-micro text-fg-muted">
            <span className="font-mono tabular-nums">{detail.code}</span>
            <span>· period <span className="font-mono">{fmt(detail.periodStart)} → {fmt(detail.periodEnd)}</span></span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/print/packs/${detail.id}`} target="_blank" className="rounded-md border border-strong px-3 py-1.5 text-small text-fg-secondary hover:border-accent">
            Open print view ↗
          </Link>
          {canManage && !sealed && <Button variant="primary" onClick={() => setSealOpen(true)}>Re-auth &amp; seal</Button>}
        </div>
      </div>

      {sealed && (
        <div className="flex items-center gap-2 rounded-md bg-status-neutral-bg px-4 py-2.5 text-small">
          <span className="font-medium text-fg-primary">🔒 Sealed &amp; immutable.</span>
          <span className="text-fg-secondary">The snapshot was frozen at sealing; corrections are a new pack.</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="flex flex-col gap-4">
          {editable ? (
            <>
              <Card title="Frameworks in scope">
                <p className="mb-2 text-micro text-fg-muted">Coverage for the selected frameworks is rolled into the pack.</p>
                <div className="flex flex-col gap-1.5">
                  {candidates!.frameworks.length === 0 && <p className="text-small text-fg-muted">No enabled frameworks.</p>}
                  {candidates!.frameworks.map((f) => (
                    <Checkbox key={f.framework} checked={frameworks.includes(f.framework)} onChange={() => toggle(frameworks, setFrameworks, f.framework)} label={`${f.framework} · ${f.jurisdiction}`} />
                  ))}
                </div>
              </Card>

              <PickerCard
                title={`Findings (${findingIds.length})`}
                empty="No findings to include."
                rows={candidates!.findings.map((f) => ({ id: f.id, ref: f.code, label: f.title, meta: `${f.level} · ${f.status}` }))}
                selected={findingIds}
                onToggle={(id) => toggle(findingIds, setFindingIds, id)}
              />
              <PickerCard
                title={`Documents (${documentIds.length})`}
                empty="No documents to include."
                rows={candidates!.documents.map((d) => ({ id: d.id, ref: d.docNo, label: d.title, meta: d.category }))}
                selected={documentIds}
                onToggle={(id) => toggle(documentIds, setDocumentIds, id)}
              />
              <PickerCard
                title={`Management reviews (${reviewIds.length})`}
                empty="No reviews to include."
                rows={candidates!.reviews.map((r) => ({ id: r.id, ref: r.code, label: r.title ?? "Operational QMS review", meta: `${fmt(r.periodStart)} → ${fmt(r.periodEnd)} · ${r.status}` }))}
                selected={reviewIds}
                onToggle={(id) => toggle(reviewIds, setReviewIds, id)}
              />

              <Card title="Scope statement">
                <Textarea rows={3} value={scopeNotes} onChange={(e) => setScopeNotes(e.target.value)} placeholder="Purpose, requesting auditor/regulator, boundaries of this bundle…" />
                <div className="mt-3 flex items-center gap-3">
                  <Button variant="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save selection"}</Button>
                  <span className="text-micro text-fg-muted">Save to refresh the preview and the printable document.</span>
                </div>
              </Card>
            </>
          ) : (
            <ContentSections snap={snap} />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Pack summary">
            <div className="grid grid-cols-2 gap-2.5">
              <Metric n={snap.counts.frameworks} l="Frameworks" />
              <Metric n={snap.coverage.totals.pct == null ? "—" : `${snap.coverage.totals.pct}%`} l="Coverage (scoped)" />
              <Metric n={snap.counts.findings} l="Findings" />
              <Metric n={snap.counts.documents} l="Documents" />
              <Metric n={snap.counts.reviews} l="Reviews" />
              <Metric n={`${snap.counts.evidence}/${snap.evidenceIndex.length}`} l="Evidence hashed" />
            </div>
          </Card>

          {sealed && detail.signature ? (
            <Card title="Seal">
              <SignatureBlock signerName={detail.sealedBy ?? "Signer"} signedAtUtc={detail.signature.signedAtUtc} payloadHash={detail.signature.payloadHash} method={detail.signature.method as "password" | "passkey"} meaning={meaning} />
            </Card>
          ) : (
            <Card title="Seal — quality / accountable manager">
              {canManage ? (
                <>
                  <p className="text-small text-fg-secondary">Sealing freezes the selected items into an immutable snapshot and anchors the bundle with a signature hash.</p>
                  <div className="mt-3"><Button variant="primary" onClick={() => setSealOpen(true)} disabled={frameworks.length === 0}>Re-auth &amp; seal</Button></div>
                  {frameworks.length === 0 && <p className="mt-2 text-micro text-fg-muted">Select at least one framework first.</p>}
                </>
              ) : (
                <p className="text-small text-fg-muted">A quality or accountable manager seals this pack.</p>
              )}
            </Card>
          )}

          <Card title="History">
            {history.length ? <Timeline events={history.map((h) => ({ ...h, action: ACTIONS[h.action] ?? h.action }))} /> : <p className="text-small text-fg-muted">No history yet.</p>}
          </Card>
        </div>
      </div>

      {canManage && !sealed && (
        <SignatureCeremony open={sealOpen} onClose={() => setSealOpen(false)} meaning={meaning} onSign={(proof) => sealPackAction(detail.id, meaning, proof)} />
      )}
    </div>
  );
}

interface PickRow { id: string; ref: string; label: string; meta: string }

function PickerCard({ title, rows, selected, onToggle, empty }: { title: string; rows: PickRow[]; selected: string[]; onToggle: (id: string) => void; empty: string }) {
  return (
    <Card title={title}>
      {rows.length === 0 ? (
        <p className="text-small text-fg-muted">{empty}</p>
      ) : (
        <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
          {rows.map((r) => (
            <div key={r.id} onClick={() => onToggle(r.id)} className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1 hover:bg-bg-inset">
              <Checkbox checked={selected.includes(r.id)} readOnly className="pointer-events-none" />
              <span className="font-mono text-micro tabular-nums text-fg-secondary">{r.ref}</span>
              <span className="flex-1 truncate text-small text-fg-primary">{r.label}</span>
              <span className="text-micro text-fg-muted">{r.meta}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ContentSections({ snap }: { snap: AuditPackDetail["snapshot"] }) {
  return (
    <>
      <Card title="Coverage (scoped frameworks)">
        {snap.coverage.byFramework.length === 0 ? (
          <p className="text-small text-fg-muted">No frameworks in scope.</p>
        ) : (
          <table className="w-full text-small">
            <thead><tr className="text-left text-micro text-fg-muted"><th className="pb-1">Framework</th><th className="pb-1 text-right">Covered</th><th className="pb-1 text-right">Partial</th><th className="pb-1 text-right">Gap</th><th className="pb-1 text-right">%</th></tr></thead>
            <tbody className="font-mono tabular-nums">
              {snap.coverage.byFramework.map((f) => (
                <tr key={f.framework} className="border-t border-subtle"><td className="py-1 font-sans text-fg-primary">{f.framework}</td><td className="py-1 text-right">{f.covered}</td><td className="py-1 text-right">{f.partial}</td><td className="py-1 text-right">{f.gap}</td><td className="py-1 text-right">{f.pct ?? "—"}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Card title={`Findings (${snap.findings.length})`}>
        {snap.findings.length === 0 ? <p className="text-small text-fg-muted">None included.</p> : (
          <ul className="flex flex-col gap-1 text-small">
            {snap.findings.map((f) => (<li key={f.code} className="flex items-center gap-2"><span className="font-mono text-micro text-fg-secondary">{f.code}</span><span className="flex-1 truncate text-fg-primary">{f.title}</span><span className="text-micro text-fg-muted">{f.level} · {f.status}</span></li>))}
          </ul>
        )}
      </Card>
      <Card title={`Documents (${snap.documents.length})`}>
        {snap.documents.length === 0 ? <p className="text-small text-fg-muted">None included.</p> : (
          <ul className="flex flex-col gap-1 text-small">
            {snap.documents.map((d) => (<li key={d.docNo} className="flex items-center gap-2"><span className="font-mono text-micro text-fg-secondary">{d.docNo}{d.revNo != null ? ` r${d.revNo}` : ""}</span><span className="flex-1 truncate text-fg-primary">{d.title}</span><span className="text-micro text-fg-muted">{d.status}</span></li>))}
          </ul>
        )}
      </Card>
      <Card title={`Evidence index (${snap.evidenceIndex.length})`}>
        {snap.evidenceIndex.length === 0 ? <p className="text-small text-fg-muted">No artifacts.</p> : (
          <ul className="flex flex-col gap-1 text-micro">
            {snap.evidenceIndex.map((e, idx) => (<li key={idx} className="flex items-center gap-2"><span className="font-mono text-fg-secondary">{e.ref}</span><span className="flex-1 truncate text-fg-primary">{e.label}</span><span className="font-mono text-fg-muted">{e.hash ? `${e.hash.slice(0, 12)}…` : "no hash"}</span></li>))}
          </ul>
        )}
      </Card>
    </>
  );
}
