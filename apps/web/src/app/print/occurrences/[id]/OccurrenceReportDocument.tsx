import type { OccurrenceDetail } from "@/server/safety";
import type { OccurrenceReportMeta } from "@dronops/shared";
import { PrintButton } from "./PrintButton";

const fmtTs = (iso: string | null) => (iso ? iso.replace("T", " ").slice(0, 19) + " UTC" : "—");
const CLASS_LABEL: Record<string, string> = { incident: "Incident", accident: "Accident", hazard_observation: "Hazard observation" };

/**
 * Regulator occurrence report (S-06) as a light, paginated document. The legal
 * header (authority, clause, reporting timeframe, Oman immediate-contacts /
 * listed tier) is bound to the record's jurisdiction via occurrenceReportMeta —
 * the "format per jurisdiction". Always the `print` theme (DESIGN_SYSTEM §4);
 * exported via the browser's Print → Save-as-PDF.
 */
export function OccurrenceReportDocument({
  detail,
  meta,
  orgName,
}: {
  detail: OccurrenceDetail;
  meta: OccurrenceReportMeta;
  orgName: string | null;
}) {
  const d = detail;
  const reported = d.reportedToRegulatorAt != null;

  return (
    <div data-theme="print" className="min-h-screen bg-app text-fg-primary">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-default bg-inset px-6 py-3 text-small print:hidden">
        <span className="text-fg-muted">Occurrence report <span className="font-mono text-fg-secondary">{d.code}</span> — {meta.authority}</span>
        <PrintButton />
      </div>

      <article className="mx-auto max-w-[820px] px-12 py-10 leading-relaxed">
        {/* ---- Header ---- */}
        <header className="border-b-2 border-fg-primary pb-6">
          <div className="text-micro uppercase tracking-widest text-fg-muted">{orgName ?? "Operator"} · Occurrence report</div>
          <h1 className="mt-2 text-3xl font-bold">{d.title}</h1>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-small tabular-nums text-fg-secondary">
            <span>{d.code}</span>
            <span>{CLASS_LABEL[d.classification] ?? d.classification}</span>
            <span>Occurred {fmtTs(d.occurredAt)}</span>
          </div>
        </header>

        {/* ---- Regulatory header (per jurisdiction) ---- */}
        <Section title="1 · Reporting requirement">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-small">
            <KV label="Authority" value={meta.authority} />
            <KV label="Legal basis" value={meta.clause ?? "—"} />
            <KV label="Reporting timeframe" value={meta.timeframe} />
            <KV label="Report status" value={reported ? `Reported ${fmtTs(d.reportedToRegulatorAt)}` : "Not yet reported"} />
          </dl>
          {meta.immediate && (
            <p className="mt-3 rounded border border-default bg-inset p-3 text-small">
              <span className="font-semibold">Immediate report required.</span>{meta.contacts ? ` Contact: ${meta.contacts}.` : ""}{meta.listedTimeframe ? ` Listed incidents: ${meta.listedTimeframe.toLowerCase()}.` : ""}
            </p>
          )}
        </Section>

        {/* ---- Occurrence particulars ---- */}
        <Section title="2 · Occurrence particulars">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-small">
            <KV label="Classification" value={CLASS_LABEL[d.classification] ?? d.classification} />
            <KV label="Date & time (UTC)" value={fmtTs(d.occurredAt)} />
            <KV label="Mission" value={d.missionCode ?? "—"} />
            <KV label="Aircraft" value={d.aircraftLabel ?? "—"} />
            <KV label="Pilot in command" value={d.pilotName ?? "—"} />
            <KV label="Flight log on file" value={d.flightRecordId ? "Yes (content-addressed)" : "—"} />
          </dl>
        </Section>

        {/* ---- Narrative ---- */}
        <Section title="3 · Description">
          <p className="whitespace-pre-wrap text-small">{d.description || "—"}</p>
        </Section>

        {/* ---- Investigation ---- */}
        <Section title="4 · Investigation">
          <Field label="Summary" value={d.investigationSummary} />
          <Field label="Root cause" value={d.rootCause} />
          {d.escalatedFindingCode && (
            <p className="mt-2 text-small text-fg-secondary">Escalated to nonconformity <span className="font-mono">{d.escalatedFindingCode}</span> for corrective action.</p>
          )}
        </Section>

        {/* ---- Reporter ---- */}
        <Section title="5 · Reporting">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-small">
            <KV label="Reported by" value={d.reportedBy ?? "—"} />
            <KV label="Filed (capture time)" value={fmtTs(d.reportedAt)} />
            <KV label="Status" value={d.status === "closed" ? `Closed${d.closedBy ? ` by ${d.closedBy}` : ""}` : d.status === "investigating" ? "Under investigation" : "Open"} />
            <KV label="Notified to authority" value={reported ? fmtTs(d.reportedToRegulatorAt) : "Pending"} />
          </dl>
        </Section>

        <footer className="mt-10 border-t border-subtle pt-3 text-micro text-fg-muted">
          {orgName ?? "Operator"} · {d.code} · {meta.authority} · generated {fmtTs(new Date().toISOString())}
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
function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col border-b border-subtle pb-1">
      <dt className="text-micro text-fg-muted">{label}</dt>
      <dd className="text-fg-primary">{value}</dd>
    </div>
  );
}
function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="mb-2">
      <div className="text-small font-medium text-fg-secondary">{label}</div>
      <p className="whitespace-pre-wrap text-small">{value || "—"}</p>
    </div>
  );
}
