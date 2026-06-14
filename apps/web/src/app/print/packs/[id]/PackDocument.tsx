import type { AuditPackDetail } from "@/server/audit-pack";
import { PrintButton } from "./PrintButton";

const fmt = (iso: string | null) => (iso ? iso.slice(0, 10) : "—");
const fmtTs = (iso: string | null) => (iso ? iso.replace("T", " ").slice(0, 19) + " UTC" : "—");

/**
 * The audit-pack bundle as a light, paginated document (cover + sections +
 * evidence index). Always rendered in the `print` theme (light tokens) per
 * DESIGN_SYSTEM §4; the operator exports it via the browser's Print → Save-as-PDF.
 * Renders LIVE from the draft snapshot or the frozen snapshot once sealed.
 */
export function PackDocument({ detail, orgName }: { detail: AuditPackDetail; orgName: string | null }) {
  const s = detail.snapshot;
  const sealed = detail.status === "sealed";

  return (
    <div data-theme="print" className="min-h-screen bg-app text-fg-primary">
      {/* Screen-only toolbar (hidden when printing). */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-default bg-inset px-6 py-3 text-small print:hidden">
        <span className="text-fg-muted">Audit pack <span className="font-mono text-fg-secondary">{detail.code}</span> — printable bundle</span>
        <PrintButton />
      </div>

      <article className="mx-auto max-w-[820px] px-12 py-10 leading-relaxed">
        {/* ---- Cover ---- */}
        <header className="border-b-2 border-fg-primary pb-6">
          <div className="text-micro uppercase tracking-widest text-fg-muted">{orgName ?? "Operator"} · Compliance evidence pack</div>
          <h1 className="mt-2 text-3xl font-bold">{detail.title ?? "Compliance evidence pack"}</h1>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-small tabular-nums text-fg-secondary">
            <span>{detail.code}</span>
            <span>Period {fmt(detail.periodStart)} → {fmt(detail.periodEnd)}</span>
            <span>{sealed ? `Sealed ${fmtTs(detail.sealedAt)}` : "DRAFT — not sealed"}</span>
          </div>
          {s.scope.frameworks.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {s.scope.frameworks.map((f) => (
                <span key={f} className="rounded border border-default px-2 py-0.5 font-mono text-micro text-fg-secondary">{f}</span>
              ))}
            </div>
          )}
          {detail.scopeNotes && <p className="mt-4 whitespace-pre-wrap text-small text-fg-secondary">{detail.scopeNotes}</p>}
        </header>

        {/* ---- Summary ---- */}
        <Section title="1 · Summary">
          <dl className="grid grid-cols-3 gap-x-6 gap-y-2 text-small">
            <Stat label="Frameworks" value={s.counts.frameworks} />
            <Stat label="Scoped coverage" value={s.coverage.totals.pct == null ? "—" : `${s.coverage.totals.pct}%`} />
            <Stat label="Open findings" value={s.counts.openFindings} />
            <Stat label="Findings included" value={s.counts.findings} />
            <Stat label="Documents included" value={s.counts.documents} />
            <Stat label="Reviews included" value={s.counts.reviews} />
            <Stat label="Evidence artifacts" value={s.evidenceIndex.length} />
            <Stat label="Hash-verifiable" value={`${s.counts.evidence}/${s.evidenceIndex.length}`} />
          </dl>
        </Section>

        {/* ---- Coverage ---- */}
        <Section title="2 · Coverage (scoped frameworks)">
          {s.coverage.byFramework.length === 0 ? (
            <Empty>No frameworks in scope.</Empty>
          ) : (
            <Table head={["Framework", "Total", "Covered", "Partial", "Gap", "%"]}>
              {s.coverage.byFramework.map((f) => (
                <tr key={f.framework} className="border-t border-subtle">
                  <Td>{f.framework}</Td><Tdn>{f.total}</Tdn><Tdn>{f.covered}</Tdn><Tdn>{f.partial}</Tdn><Tdn>{f.gap}</Tdn><Tdn>{f.pct ?? "—"}</Tdn>
                </tr>
              ))}
              <tr className="border-t-2 border-fg-primary font-semibold">
                <Td>Total</Td><Tdn>{s.coverage.totals.total}</Tdn><Tdn>{s.coverage.totals.covered}</Tdn><Tdn>{s.coverage.totals.partial}</Tdn><Tdn>{s.coverage.totals.gap}</Tdn><Tdn>{s.coverage.totals.pct ?? "—"}</Tdn>
              </tr>
            </Table>
          )}
        </Section>

        {/* ---- Findings ---- */}
        <Section title={`3 · Findings (${s.findings.length})`}>
          {s.findings.length === 0 ? <Empty>No findings included.</Empty> : (
            <Table head={["Ref", "Finding", "Jurisdiction", "Level", "Status", "Due"]}>
              {s.findings.map((f) => (
                <tr key={f.code} className="border-t border-subtle">
                  <Td mono>{f.code}</Td><Td>{f.title}</Td><Td>{f.jurisdiction ?? "—"}</Td><Td>{f.level}</Td><Td>{f.status}</Td><Td mono>{fmt(f.dueAt)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Section>

        {/* ---- Documents ---- */}
        <Section title={`4 · Documents (${s.documents.length})`}>
          {s.documents.length === 0 ? <Empty>No documents included.</Empty> : (
            <Table head={["Doc no.", "Rev", "Title", "Category", "Status"]}>
              {s.documents.map((d) => (
                <tr key={d.docNo} className="border-t border-subtle">
                  <Td mono>{d.docNo}</Td><Td mono>{d.revNo != null ? `r${d.revNo}` : "—"}</Td><Td>{d.title}</Td><Td>{d.category}</Td><Td>{d.status}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Section>

        {/* ---- Reviews ---- */}
        <Section title={`5 · Management reviews (${s.reviews.length})`}>
          {s.reviews.length === 0 ? <Empty>No reviews included.</Empty> : (
            <Table head={["Ref", "Review", "Period", "Status", "Signed"]}>
              {s.reviews.map((r) => (
                <tr key={r.code} className="border-t border-subtle">
                  <Td mono>{r.code}</Td><Td>{r.title ?? "Operational QMS review"}</Td><Td mono>{fmt(r.periodStart)} → {fmt(r.periodEnd)}</Td><Td>{r.status}</Td><Td mono>{fmt(r.signedAt)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Section>

        {/* ---- Evidence index ---- */}
        <Section title={`6 · Evidence index (${s.evidenceIndex.length})`}>
          <p className="mb-2 text-micro text-fg-muted">Each included artifact and its integrity anchor (SHA-256 of the content-addressed file, or the review signature payload hash).</p>
          {s.evidenceIndex.length === 0 ? <Empty>No artifacts.</Empty> : (
            <Table head={["#", "Ref", "Kind", "Artifact", "Integrity hash"]}>
              {s.evidenceIndex.map((e, i) => (
                <tr key={i} className="border-t border-subtle">
                  <Tdn>{i + 1}</Tdn><Td mono>{e.ref}</Td><Td>{e.kind}</Td><Td>{e.label}</Td>
                  <Td mono>{e.hash ?? <span className="text-fg-muted">— no file —</span>}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Section>

        {/* ---- Attestation ---- */}
        <Section title="7 · Attestation">
          {sealed && detail.signature ? (
            <div className="rounded border border-default bg-inset p-4 text-small">
              <p>Sealed by <span className="font-semibold">{detail.sealedBy ?? "Signer"}</span> on <span className="font-mono">{fmtTs(detail.signature.signedAtUtc)}</span> via {detail.signature.method === "passkey" ? "passkey" : "password"} re-authentication.</p>
              <p className="mt-2 break-all font-mono text-micro text-fg-secondary">Pack signature: {detail.signature.payloadHash}</p>
              <p className="mt-2 text-micro text-fg-muted">This hash anchors the frozen snapshot above; any change to the bundle invalidates it.</p>
            </div>
          ) : (
            <div className="rounded border border-default bg-inset p-4 text-small text-fg-secondary">
              <p className="font-semibold">DRAFT — not yet sealed.</p>
              <p className="mt-1 text-micro text-fg-muted">Figures render live from current data and are not frozen. Seal the pack to anchor an immutable, hash-verifiable snapshot.</p>
            </div>
          )}
        </Section>

        <footer className="mt-10 border-t border-subtle pt-3 text-micro text-fg-muted">
          {orgName ?? "Operator"} · {detail.code} · generated {fmtTs(new Date().toISOString())}
        </footer>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 break-inside-avoid">
      <h2 className="mb-3 border-b border-default pb-1 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between border-b border-subtle pb-1">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="font-mono font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full border-collapse text-small">
      <thead>
        <tr className="text-left text-micro uppercase tracking-wide text-fg-muted">
          {head.map((h) => <th key={h} className="pb-1.5 font-medium">{h}</th>)}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}
function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return <td className={`py-1 pr-3 align-top ${mono ? "font-mono text-micro tabular-nums" : ""}`}>{children}</td>;
}
function Tdn({ children }: { children: React.ReactNode }) {
  return <td className="py-1 pr-3 text-right font-mono tabular-nums">{children}</td>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-small text-fg-muted">{children}</p>;
}
