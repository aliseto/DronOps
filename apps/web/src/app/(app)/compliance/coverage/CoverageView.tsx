"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Button,
  Drawer,
  EmptyState,
  Select,
  StatusPill,
  Textarea,
  type StatusVocab,
} from "@dronops/ui";
import type { CoverageMatrix, CoverageRequirementRow } from "@/server/compliance";
import { setCoverageAction, raiseFindingFromGapAction } from "../actions";

type Cov = StatusVocab["coverage"];
const asCov = (s: string): Cov => s as Cov;

function Bar({ fw }: { fw: CoverageMatrix["frameworks"][number] }) {
  const pc = (n: number) => (fw.total ? `${(n / fw.total) * 100}%` : "0%");
  return (
    <div className="flex h-2 overflow-hidden rounded-pill bg-bg-inset">
      <span className="block h-full bg-status-ok-fg" style={{ width: pc(fw.covered) }} />
      <span className="block h-full bg-status-warn-fg" style={{ width: pc(fw.partial) }} />
      <span className="block h-full bg-status-danger-fg" style={{ width: pc(fw.gap) }} />
    </div>
  );
}

export function CoverageView({
  matrix,
  documents,
  canAssess,
  selectedRef,
}: {
  matrix: CoverageMatrix;
  documents: { id: string; label: string }[];
  canAssess: boolean;
  selectedRef: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [gapsOnly, setGapsOnly] = useState(false);
  const selected = selectedRef ? matrix.rows.find((r) => r.requirementRef === selectedRef) ?? null : null;
  const openRow = (ref: string) => router.push(`${pathname}?req=${encodeURIComponent(ref)}`);
  const close = () => router.push(pathname);

  const grouped = useMemo(() => {
    const rows = gapsOnly ? matrix.rows.filter((r) => r.status === "gap") : matrix.rows;
    const order = matrix.frameworks.map((f) => f.framework);
    const byFw = new Map<string, CoverageRequirementRow[]>();
    for (const r of rows) (byFw.get(r.framework) ?? byFw.set(r.framework, []).get(r.framework)!).push(r);
    return order.filter((fw) => byFw.has(fw)).map((fw) => ({ fw, rows: byFw.get(fw)! }));
  }, [matrix, gapsOnly]);

  const t = matrix.totals;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-display text-fg-primary">Coverage</h1>
        <p className="text-small text-fg-muted">
          Requirement coverage across your enabled frameworks — the QMS view, and the gap list audit packs are built
          from. A gap can be escalated to an audit finding.
        </p>
      </div>

      {t.total === 0 ? (
        <EmptyState title="No requirements" description="Enable a jurisdiction in settings to populate the coverage matrix." />
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="min-w-[170px] rounded-xl border border-default bg-bg-surface px-4 py-3">
              <div className="text-micro text-fg-muted">Overall coverage</div>
              <div className="font-mono text-3xl font-bold tabular-nums text-fg-primary">{t.pct ?? "—"}<span className="text-base">%</span></div>
              <div className="text-micro text-fg-muted">{t.covered} covered · {t.partial} partial · {t.gap} gaps · {t.na} n/a · {t.total} total</div>
            </div>
            {matrix.frameworks.map((fw) => (
              <div key={fw.framework} className="min-w-[200px] flex-1 rounded-xl border border-default bg-bg-surface px-3.5 py-3">
                <div className="flex justify-between text-small">
                  <span>{fw.framework} <span className="text-micro text-fg-muted">· {fw.jurisdiction}</span></span>
                  <span className="font-mono tabular-nums">{fw.pct ?? "—"}%</span>
                </div>
                <div className="my-2"><Bar fw={fw} /></div>
                <div className="flex gap-3 text-micro text-fg-muted">
                  <span>{fw.covered} covered</span><span>{fw.partial} partial</span><span className="text-status-danger-fg">{fw.gap} gaps</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-small text-fg-muted">{t.total} requirements across {matrix.frameworks.length} enabled framework{matrix.frameworks.length === 1 ? "" : "s"}</span>
            <button
              onClick={() => setGapsOnly((v) => !v)}
              className={`rounded-pill border px-3 py-1 text-small ${gapsOnly ? "border-transparent bg-status-danger-bg text-status-danger-fg" : "border-strong text-fg-secondary"}`}
            >
              {gapsOnly ? `Gaps only · ${t.gap}` : "Show all"}
            </button>
          </div>

          <div className="rounded-xl border border-default">
            {grouped.length === 0 ? (
              <div className="p-6"><EmptyState title="No gaps" description="Every requirement in scope is covered or n/a." /></div>
            ) : (
              grouped.map(({ fw, rows }) => (
                <div key={fw} className="px-3.5 py-1">
                  <div className="flex justify-between border-b border-subtle py-2 text-micro uppercase tracking-wide text-fg-muted">
                    <span>{fw} · {rows[0]!.jurisdiction}</span>
                    <span>{rows.filter((r) => r.status === "gap").length} gaps</span>
                  </div>
                  {rows.map((r) => (
                    <button key={r.requirementRef} onClick={() => openRow(r.requirementRef)} className="grid w-full grid-cols-[1fr_2.4fr_1fr_1fr] items-center gap-2 border-b border-subtle py-2 text-start text-small last:border-b-0 hover:bg-bg-raised">
                      <span className="font-mono text-micro tabular-nums text-fg-secondary">{r.clause}</span>
                      <span className="text-fg-primary">{r.title}</span>
                      <span><StatusPill domain="coverage" status={asCov(r.status)} /></span>
                      <span className="text-micro text-fg-muted">{r.controllingDocumentId ? "📎 linked" : "—"}</span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {selected && <AssessDrawer key={selected.requirementRef} row={selected} documents={documents} canAssess={canAssess} onClose={close} />}
    </div>
  );
}

function AssessDrawer({ row, documents, canAssess, onClose }: { row: CoverageRequirementRow; documents: { id: string; label: string }[]; canAssess: boolean; onClose: () => void }) {
  const [status, setStatus] = useState<Cov>(asCov(row.status));
  const opts: { v: Cov; label: string; cls: string }[] = [
    { v: "covered", label: "Covered", cls: "bg-status-ok-bg text-status-ok-fg" },
    { v: "partial", label: "Partial", cls: "bg-status-warn-bg text-status-warn-fg" },
    { v: "gap", label: "Gap", cls: "bg-status-danger-bg text-status-danger-fg" },
    { v: "n-a", label: "N/A", cls: "bg-status-neutral-bg text-status-neutral-fg" },
  ];
  return (
    <Drawer
      open
      onClose={onClose}
      title={<span className="flex items-center gap-3"><span>{row.title}</span><StatusPill domain="coverage" status={status} /></span>}
    >
      <div className="mb-3 flex flex-wrap items-center gap-3 text-micro text-fg-muted">
        <span className="font-mono tabular-nums">{row.framework} · {row.clause}</span>
        <span>{row.jurisdiction}</span>
        <span className="capitalize">{row.riskTier.replace("_", " ")}</span>
      </div>

      {canAssess ? (
        <form action={setCoverageAction} className="flex flex-col gap-3">
          <input type="hidden" name="requirementRef" value={row.requirementRef} />
          <input type="hidden" name="status" value={status} />
          <div>
            <span className="text-micro text-fg-muted">Coverage status</span>
            <div className="mt-1 flex gap-1.5">
              {opts.map((o) => (
                <button type="button" key={o.v} onClick={() => setStatus(o.v)} className={`flex-1 rounded-md border px-2 py-1.5 text-small font-semibold ${status === o.v ? `border-transparent ${o.cls}` : "border-strong text-fg-secondary"}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-1 text-small">
            <span className="text-micro text-fg-muted">Controlling document</span>
            <Select name="controllingDocumentId" placeholder="Link a document…" defaultValue={row.controllingDocumentId ?? undefined} options={documents.map((d) => ({ value: d.id, label: d.label }))} />
          </label>
          <label className="flex flex-col gap-1 text-small">
            <span className="text-micro text-fg-muted">Note</span>
            <Textarea name="note" rows={2} defaultValue={row.note ?? ""} placeholder="Evidence / rationale…" />
          </label>
          <Button type="submit" variant="primary">Save assessment</Button>
        </form>
      ) : (
        <p className="text-small text-fg-muted">Coverage is assessed by a quality manager.</p>
      )}

      {row.status === "gap" && canAssess && (
        <div className="mt-4 rounded-md bg-status-danger-bg px-3 py-2.5 text-micro text-status-danger-fg">
          This gap can be escalated to an <b>audit finding</b> (NCR → CAPA), closing the loop with the deviation engine.
          <form action={raiseFindingFromGapAction} className="mt-2">
            <input type="hidden" name="requirementRef" value={row.requirementRef} />
            <Button type="submit" variant="secondary">Raise audit finding →</Button>
          </form>
        </div>
      )}
    </Drawer>
  );
}
