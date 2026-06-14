"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Select, SignatureBlock, SignatureCeremony, StatusPill, Timeline, type TimelineEvent } from "@dronops/ui";
import {
  determineSora,
  osoRequirements,
  OSO_GROUP_LABELS,
  SCENARIO_LABELS,
  UA_DIMENSION_BANDS,
  UA_DIMENSION_LABELS,
  ROBUSTNESS_LEVELS,
  ARC_CLASSES,
  type ArcClass,
  type OperationalScenario,
  type OsoGroup,
  type OsoLevel,
  type Robustness,
  type UaDimensionBand,
} from "@dronops/shared";
import type { SoraDetail } from "@/server/sora";
import { SailBadge } from "../SailBadge";
import { approveSoraAction, updateSoraAction } from "../actions";

const SCENARIO_OPTS = (Object.keys(SCENARIO_LABELS) as OperationalScenario[]).map((v) => ({ value: v, label: SCENARIO_LABELS[v] }));
const DIM_OPTS = UA_DIMENSION_BANDS.map((v) => ({ value: v, label: UA_DIMENSION_LABELS[v] }));
const ROB_OPTS = ROBUSTNESS_LEVELS.map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));
const ARC_OPTS = ARC_CLASSES.map((v) => ({ value: v, label: `ARC-${v}` }));
const REDUCT_OPTS = [0, 1, 2, 3].map((n) => ({ value: String(n), label: `${n} step${n === 1 ? "" : "s"}` }));
const ACTIONS: Record<string, string> = { "sora.create": "Created", "sora.update": "Edited", "sora.approve": "Approved" };

function Row({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between border-b border-subtle py-1.5 last:border-0 ${strong ? "font-semibold" : ""}`}>
      <span className="text-small text-fg-secondary">{label}</span>
      <span className="font-mono tabular-nums text-fg-primary">{value}</span>
    </div>
  );
}

export function SoraBuilderView({
  detail,
  canEdit,
  canApprove,
  history,
}: {
  detail: SoraDetail;
  canEdit: boolean;
  canApprove: boolean;
  history: TimelineEvent[];
}) {
  const approved = detail.status === "approved";
  const editable = canEdit && !approved;
  const [signOpen, setSignOpen] = useState(false);

  const [inputs, setInputs] = useState({
    scenario: detail.scenario as OperationalScenario,
    dimension: detail.dimension as UaDimensionBand,
    m1: detail.m1 as Robustness,
    m2: detail.m2 as Robustness,
    m3: detail.m3 as Robustness,
    initialArc: detail.initialArc as ArcClass,
    arcReduction: detail.arcReduction,
  });

  const det = determineSora(inputs);

  async function set<K extends keyof typeof inputs>(key: K, value: (typeof inputs)[K]) {
    const next = { ...inputs, [key]: value };
    setInputs(next);
    await updateSoraAction(detail.id, { [key]: value } as Parameters<typeof updateSoraAction>[1]);
  }

  const meaning = `I approve SORA assessment ${detail.code} and accept the determination: final GRC ${det.finalGrc}, residual ${det.residualArc.toUpperCase()}, SAIL ${det.sailRoman}.`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/safety/sora" className="text-micro text-fg-muted">← SORA assessments</Link>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-display text-fg-primary">{detail.title}</h1>
            <StatusPill domain="document" status={approved ? "effective" : "draft"} />
          </div>
          <div className="flex items-center gap-2 text-micro text-fg-muted">
            <span className="font-mono tabular-nums">{detail.code}</span>
            <span>· JARUS SORA 2.0</span>
            {detail.missionCode && <span>· mission <Link href={`/operations/${detail.missionId}`} className="font-mono text-accent">{detail.missionCode}</Link></span>}
          </div>
        </div>
        {canApprove && !approved && <Button variant="primary" onClick={() => setSignOpen(true)} disabled={det.outOfScope}>Re-auth &amp; approve</Button>}
      </div>

      {approved && (
        <div className="flex items-center gap-2 rounded-md bg-status-neutral-bg px-4 py-2.5 text-small">
          <span className="font-medium text-fg-primary">🔒 Approved &amp; immutable.</span>
          <span className="text-fg-secondary">The determination was frozen at approval; corrections are a new assessment.</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Inputs */}
        <Card title="Operation & mitigations">
          <div className="flex flex-col gap-3">
            <Field label="Operational scenario"><Select disabled={!editable} value={inputs.scenario} onChange={(e) => set("scenario", e.target.value as OperationalScenario)} options={SCENARIO_OPTS} /></Field>
            <Field label="Max UA characteristic dimension"><Select disabled={!editable} value={inputs.dimension} onChange={(e) => set("dimension", e.target.value as UaDimensionBand)} options={DIM_OPTS} /></Field>

            <div className="mt-1 text-micro font-medium uppercase tracking-wide text-fg-muted">Ground-risk mitigations</div>
            <div className="grid grid-cols-3 gap-2">
              <Field label="M1 strategic"><Select disabled={!editable} value={inputs.m1} onChange={(e) => set("m1", e.target.value as Robustness)} options={ROB_OPTS} /></Field>
              <Field label="M2 impact"><Select disabled={!editable} value={inputs.m2} onChange={(e) => set("m2", e.target.value as Robustness)} options={ROB_OPTS} /></Field>
              <Field label="M3 ERP"><Select disabled={!editable} value={inputs.m3} onChange={(e) => set("m3", e.target.value as Robustness)} options={ROB_OPTS} /></Field>
            </div>

            <div className="mt-1 text-micro font-medium uppercase tracking-wide text-fg-muted">Air risk</div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Initial ARC"><Select disabled={!editable} value={inputs.initialArc} onChange={(e) => set("initialArc", e.target.value as ArcClass)} options={ARC_OPTS} /></Field>
              <Field label="Strategic reduction"><Select disabled={!editable} value={String(inputs.arcReduction)} onChange={(e) => set("arcReduction", Number(e.target.value))} options={REDUCT_OPTS} /></Field>
            </div>
            <p className="text-micro text-fg-muted">M3 (ERP) at Low robustness adds +1 to the GRC; M1 High subtracts 4. Values follow the SORA 2.0 reference tables.</p>
          </div>
        </Card>

        {/* Determination + sign-off */}
        <div className="flex flex-col gap-4">
          <Card title="Determination">
            <div className="mb-3 flex items-center justify-between rounded-lg bg-bg-inset px-4 py-3">
              <div>
                <div className="text-micro text-fg-muted">Specific Assurance &amp; Integrity Level</div>
                <div className="text-small text-fg-secondary">final GRC {det.finalGrc} × residual {det.residualArc.toUpperCase()}</div>
              </div>
              <SailBadge sail={det.sail} roman={det.sailRoman} large />
            </div>
            <Row label="Intrinsic GRC" value={det.intrinsicGrc} />
            <Row label="Mitigation adjustment" value={det.grcAdjustment > 0 ? `+${det.grcAdjustment}` : det.grcAdjustment} />
            <Row label="Final GRC" value={det.finalGrc} strong />
            <Row label="Residual ARC" value={det.residualArc.toUpperCase()} />
            {det.outOfScope && (
              <p className="mt-3 rounded bg-status-danger-bg px-3 py-2 text-small text-status-danger-fg">Final GRC &gt; 7 — certified category. SORA does not apply; this operation cannot be approved on a SAIL.</p>
            )}
          </Card>

          {approved && detail.signature ? (
            <Card title="Approval">
              <SignatureBlock signerName={detail.approvedBy ?? "Signer"} signedAtUtc={detail.signature.signedAtUtc} payloadHash={detail.signature.payloadHash} method={detail.signature.method as "password" | "passkey"} meaning={meaning} />
            </Card>
          ) : (
            <Card title="Approval — ops / accountable manager">
              {canApprove ? (
                <>
                  <p className="text-small text-fg-secondary">Approval freezes the determination and makes the record immutable.</p>
                  <div className="mt-3"><Button variant="primary" onClick={() => setSignOpen(true)} disabled={det.outOfScope}>Re-auth &amp; approve</Button></div>
                  {det.outOfScope && <p className="mt-2 text-micro text-fg-muted">An out-of-SORA operation cannot be approved.</p>}
                </>
              ) : (
                <p className="text-small text-fg-muted">An ops or accountable manager approves the assessment.</p>
              )}
            </Card>
          )}

          <Card title="History">
            {history.length ? <Timeline events={history.map((h) => ({ ...h, action: ACTIONS[h.action] ?? h.action }))} /> : <p className="text-small text-fg-muted">No history yet.</p>}
          </Card>
        </div>
      </div>

      <OsoCard sail={det.sail} sailRoman={det.sailRoman} outOfScope={det.outOfScope} />

      {canApprove && !approved && (
        <SignatureCeremony open={signOpen} onClose={() => setSignOpen(false)} meaning={meaning} onSign={(proof) => approveSoraAction(detail.id, meaning, proof)} />
      )}
    </div>
  );
}

const OSO_LEVEL_LABEL: Record<OsoLevel, string> = {
  optional: "Optional",
  low: "Low",
  medium: "Medium",
  high: "High",
};

/**
 * JARUS SORA 2.0 Table 6: the 24 OSOs at the determined SAIL. Derived from the
 * SAIL (regulation is content, not rows) — at approval the inputs freeze, so
 * this list is frozen with them.
 */
function OsoCard({ sail, sailRoman, outOfScope }: { sail: number; sailRoman: string; outOfScope: boolean }) {
  const reqs = osoRequirements(sail);
  if (outOfScope || reqs.length === 0) return null;
  const groups = [...new Set(reqs.map((r) => r.group))] as OsoGroup[];
  return (
    <Card title={`OSO requirements at SAIL ${sailRoman}`}>
      <p className="mb-2 text-micro text-fg-muted">
        Recommended robustness per JARUS SORA 2.0 Table 6 (Optional / Low / Medium / High). The
        competent authority may tailor the set.
      </p>
      <div className="grid grid-cols-1 gap-x-8 lg:grid-cols-2">
        {groups.map((g) => (
          <div key={g}>
            <div className="mt-2 text-micro font-medium uppercase tracking-wide text-fg-muted">
              {OSO_GROUP_LABELS[g]}
            </div>
            {reqs
              .filter((r) => r.group === g)
              .map((r) => (
                <div
                  key={r.no}
                  className="flex items-center justify-between gap-3 border-b border-subtle py-1.5 last:border-0"
                >
                  <span className="text-small text-fg-secondary">
                    <span className="font-mono text-micro text-fg-muted">
                      OSO#{String(r.no).padStart(2, "0")}
                    </span>{" "}
                    {r.title}
                  </span>
                  <span
                    className={`shrink-0 rounded-pill bg-inset px-2 py-0.5 font-mono text-micro tabular-nums ${
                      r.level === "optional" ? "text-fg-muted" : "font-medium text-fg-primary"
                    }`}
                  >
                    {OSO_LEVEL_LABEL[r.level]}
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1 text-small"><span className="text-fg-muted">{label}</span>{children}</label>;
}
