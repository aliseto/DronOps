"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  EmptyState,
  Input,
  Select,
  StatusPill,
  Timeline,
  Textarea,
  type StatusVocab,
  type TimelineEvent,
} from "@dronops/ui";
import type { MissionDetail, ThreadEntry } from "@/server/operations";
import {
  addInboundDocumentAction,
  addLocationAction,
  addMissionNoteAction,
  assignCrewAction,
  confirmGreenZoneAction,
  importKmlAction,
  overrideCrewAction,
  recordApprovalAction,
  transitionMissionAction,
} from "../actions";

const ACTIVITY_LABELS: Record<string, string> = {
  "mission.create": "Mission created",
  "mission.transition": "Status changed",
  "mission_crew.assign": "Crew assigned",
  "mission_crew.override": "Override logged",
  "mission_document.add": "Document added",
  "mission_location.add": "Location added",
  "mission_location.import_kml": "AOI imported (KML)",
  "mission.green_zone_confirm": "Green-zone confirmed",
};
const fmtAt = (iso: string) => iso.slice(0, 16).replace("T", " ");

type Lifecycle = StatusVocab["lifecycle"];
const fmtDate = (iso: string | null) => (iso ? iso.slice(0, 10) : "—");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const VERDICT: Record<string, StatusVocab["readiness"]> = { fit: "fit", caution: "caution", "not-fit": "not-fit", unknown: "unknown" };

export function MissionDetailView({
  detail,
  transitions,
  persons,
  roles,
  thread,
  canNote,
}: {
  detail: MissionDetail;
  transitions: { to: string; label: string; crewGate?: boolean }[];
  persons: { id: string; name: string }[];
  roles: string[];
  thread: ThreadEntry[];
  canNote: boolean;
}) {
  const m = detail.mission;
  const r = detail.readiness;
  const canApprovalAdmin = roles.includes("approval_admin");
  const canOps = roles.includes("operations_team") || roles.includes("ops_manager");
  const assignable = m.status === "approved" || m.status === "ready";
  const simpleTransitions = transitions.filter((t) => t.to !== "approved");
  const recordApprovalAllowed = transitions.some((t) => t.to === "approved");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/operations" className="text-micro text-fg-muted">← Missions</Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-display text-fg-primary">{m.title}</h1>
            <StatusPill domain="lifecycle" status={m.status as Lifecycle} />
          </div>
          <div className="text-micro text-fg-muted font-mono tabular-nums">
            {m.code} · {m.jurisdiction} · {cap(m.operationalCategory)} → tier {r.riskTier}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {simpleTransitions.map((t) => (
            <Button
              key={t.to}
              variant={t.crewGate ? "primary" : "secondary"}
              disabled={t.crewGate && r.blocked}
              onClick={() => transitionMissionAction(m.id, t.to as never)}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      {assignable && r.blocked && (
        <div className="rounded-md bg-status-danger-bg px-4 py-2.5 text-small text-status-danger-fg">
          <span className="font-medium">Approval blocked</span> — {r.crew.filter((c) => c.blocksEffective).length} crew member(s)
          fail the assignment gate. Resolve or override with a logged reason before “Mark ready”.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* LEFT */}
        <div className="flex flex-col gap-4">
          <Card title="Authorization basis">
            <div className="grid grid-cols-2 gap-3">
              <KV k="Authority" v={m.authority ?? "—"} />
              <KV k="Application ref" v={m.applicationRef ?? "—"} mono />
              <KV k="Submitted" v={fmtDate(m.submittedAt)} mono />
              <KV k="Permit type" v={m.authorizationType ?? "—"} />
              <KV k="Permit / OA no." v={m.authorizationRef ?? "—"} mono />
              <KV k="Window" v={`${fmtDate(m.plannedStartAt)} → ${fmtDate(m.plannedEndAt)}`} mono />
              <KV k="Aircraft" v={m.aircraftLabel ?? "—"} />
              <KV k="Ceiling" v={r.ceilingM != null ? `${r.ceilingM} m AGL` : "—"} mono />
            </div>

            {recordApprovalAllowed && canApprovalAdmin && (
              <form action={recordApprovalAction} className="mt-4 flex flex-col gap-3 border-t border-subtle pt-4" encType="multipart/form-data">
                <span className="text-small font-medium text-fg-primary">Record authority approval (outbound)</span>
                <input type="hidden" name="missionId" value={m.id} />
                <div className="flex flex-wrap gap-3">
                  <Field label="Authority"><Input name="authority" defaultValue={m.authority ?? ""} /></Field>
                  <Field label="Application ref"><Input name="applicationRef" defaultValue={m.applicationRef ?? ""} /></Field>
                  <Field label="Submitted"><Input name="submittedAt" type="date" /></Field>
                  <Field label="Permit type"><Input name="authorizationType" placeholder="renewal / OA …" /></Field>
                  <Field label="Permit / OA no."><Input name="authorizationRef" /></Field>
                </div>
                <Field label="Approval letter / permit (PDF)"><input type="file" name="approvalFile" accept="application/pdf,image/*" className="text-small text-fg-secondary" /></Field>
                <div><Button type="submit" variant="primary">Record approval ✓</Button></div>
              </form>
            )}
          </Card>

          <Card title="Crew — currency &amp; duty per assignment">
            {r.crew.length === 0 ? (
              <EmptyState title="No crew assigned" description={assignable ? "Assign crew; each is evaluated against currency + duty." : "Crew can be assigned once the mission is approved."} />
            ) : (
              <ul className="flex flex-col">
                {r.crew.map((c) => (
                  <li key={c.personId} className="flex items-start justify-between gap-3 border-t border-subtle py-2.5 first:border-t-0">
                    <span className="flex flex-col">
                      <Link href={`/personnel?panel=person:${c.personId}`} className="text-body font-medium text-fg-primary hover:text-accent">{c.name}</Link>
                      <span className="text-micro text-fg-muted">{cap(c.role)}{c.overridden ? " · overridden" : ""}</span>
                      {c.reasons.length > 0 && <span className="text-micro text-status-danger-fg">{c.reasons.join("; ")}</span>}
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <span className="flex items-center gap-1.5">
                        <StatusPill domain="readiness" status={VERDICT[c.verdict] ?? "unknown"} />
                        {c.dutyStatus === "breach" && <span className="text-micro font-medium text-status-danger-fg">duty breach</span>}
                      </span>
                      {c.blocksEffective && canOps && c.missionCrewId && <OverrideForm missionCrewId={c.missionCrewId} reasons={c.reasons} />}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {assignable && canOps && (
              <form action={assignCrewAction} className="mt-3 flex flex-wrap items-end gap-3 border-t border-subtle pt-3">
                <input type="hidden" name="missionId" value={m.id} />
                <Field label="Person"><Select name="personId" options={persons.map((p) => ({ value: p.id, label: p.name }))} /></Field>
                <Field label="Role"><Select name="role" options={[{ value: "pilot", label: "Pilot" }, { value: "observer", label: "Observer" }, { value: "technician", label: "Technician" }]} /></Field>
                <Button type="submit" variant="secondary">Assign</Button>
              </form>
            )}
          </Card>

          <Card title="Permitted locations">
            {detail.locations.length === 0 ? (
              <p className="text-small text-fg-muted">No locations yet. Import a KML AOI or add manually.</p>
            ) : (
              <ul className="flex flex-col gap-1 text-small">
                {detail.locations.map((l) => (
                  <li key={l.id} className="flex items-center justify-between border-t border-subtle py-1.5 first:border-t-0">
                    <span>{[l.governorate, l.wilayat, l.village].filter(Boolean).join(" · ") || "(unnamed)"}</span>
                    <span className="font-mono tabular-nums text-fg-muted">{l.latitude != null ? `${l.latitude}, ${l.longitude}` : "—"}{l.ceilingM != null ? ` · ${l.ceilingM} m` : ""}</span>
                  </li>
                ))}
              </ul>
            )}
            {canOps && (
              <div className="mt-3 flex flex-col gap-3 border-t border-subtle pt-3">
                <form action={importKmlAction} className="flex items-end gap-2">
                  <input type="hidden" name="missionId" value={m.id} />
                  <Field label="Import AOI (KML)"><input type="file" name="kml" accept=".kml,application/vnd.google-earth.kml+xml" className="text-small text-fg-secondary" /></Field>
                  <Button type="submit" variant="secondary">Import</Button>
                </form>
                <form action={addLocationAction} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="missionId" value={m.id} />
                  <Field label="Governorate"><Input name="governorate" /></Field>
                  <Field label="Wilayat"><Input name="wilayat" /></Field>
                  <Field label="Village"><Input name="village" /></Field>
                  <Field label="Lat"><Input name="latitude" className="w-24" /></Field>
                  <Field label="Long"><Input name="longitude" className="w-24" /></Field>
                  <Field label="Ceiling"><Input name="ceilingM" className="w-20" /></Field>
                  <Button type="submit" variant="ghost">Add</Button>
                </form>
              </div>
            )}
          </Card>

          <Card title="Documents">
            {detail.documents.length === 0 ? (
              <p className="text-small text-fg-muted">No documents attached.</p>
            ) : (
              <ul className="flex flex-col gap-1 text-small">
                {detail.documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between border-t border-subtle py-1.5 first:border-t-0">
                    <span>{d.label ?? d.kind}</span>
                    <span className="text-micro text-fg-muted">{d.flow} · {d.kind}</span>
                  </li>
                ))}
              </ul>
            )}
            {canOps && (
              <form action={addInboundDocumentAction} className="mt-3 flex items-end gap-2 border-t border-subtle pt-3">
                <input type="hidden" name="missionId" value={m.id} />
                <Field label="Add client / AOI document"><input type="file" name="file" className="text-small text-fg-secondary" /></Field>
                <Select name="kind" options={[{ value: "client_doc", label: "Client doc" }, { value: "aoi", label: "AOI" }, { value: "other", label: "Other" }]} />
                <Button type="submit" variant="ghost">Upload</Button>
              </form>
            )}
          </Card>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-4">
          <Card title="Mission gates">
            <Gate label="Pilot recency" detail="evaluated per crew" />
            {r.gates.map((g) => <Gate key={g.type} label={cap(g.type)} detail={g.clause} />)}
            <Gate label="Duty / rest (OSO#17)" detail={r.dutyApplies ? "applies (specific-category)" : "n/a"} />
          </Card>

          <Card title="Applicable requirements">
            <p className="text-micro text-fg-muted">{cap(m.operationalCategory)} → baseline + {r.riskTier} tier only. Other tiers excluded; ISO is org-wide.</p>
            <ReqLine k="Baseline" v={r.requirementCounts.baseline} />
            <ReqLine k="High (specific/advanced)" v={r.requirementCounts.high} muted={r.riskTier !== "high"} />
            <ReqLine k="Low (open/standard)" v={r.requirementCounts.low} muted={r.riskTier !== "low"} />
          </Card>

          {m.jurisdiction === "Oman" && (
            <Card title="Oman standing conditions">
              <div className="flex items-center justify-between py-1.5 text-small">
                <span>Green-zone confirmation <span className="text-micro text-fg-muted">(manual check — no Serb API)</span></span>
                {m.greenZoneConfirmedAt ? (
                  <span className="text-small text-status-ok-fg">confirmed {fmtDate(m.greenZoneConfirmedAt)}</span>
                ) : canOps ? (
                  <Button variant="secondary" onClick={() => confirmGreenZoneAction(m.id)}>Confirm</Button>
                ) : (
                  <span className="text-status-warn-fg text-small">required</span>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-subtle py-1.5 text-small">
                <span>Media-attribution condition</span>
                <span className={m.mediaAttribution ? "text-status-ok-fg" : "text-fg-muted"}>{m.mediaAttribution ? "acknowledged" : "—"}</span>
              </div>
            </Card>
          )}

          <Card title={`Activity${detail.notes.count ? ` · ${detail.notes.count} note${detail.notes.count === 1 ? "" : "s"}` : ""}`}>
            {canNote && (
              <form action={addMissionNoteAction} className="mb-3 flex flex-col gap-2" encType="multipart/form-data">
                <input type="hidden" name="missionId" value={m.id} />
                <Textarea name="body" rows={2} placeholder="Add a note to the mission log…" required />
                <div className="flex items-center justify-between gap-2">
                  <input type="file" name="file" className="text-micro text-fg-secondary" />
                  <Button type="submit" variant="secondary">Add note</Button>
                </div>
              </form>
            )}
            {thread.length ? <Timeline events={thread.map(toTimeline)} /> : <p className="text-small text-fg-muted">No activity yet.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}

function toTimeline(e: ThreadEntry): TimelineEvent {
  if (e.kind === "note") {
    return {
      id: e.id,
      action: "Note",
      actor: e.actor,
      at: fmtAt(e.at),
      summary: (
        <span>
          {e.body}
          {e.hasAttachment ? <span className="text-fg-muted"> · 📎 attachment</span> : null}
        </span>
      ),
    };
  }
  return { id: e.id, action: ACTIVITY_LABELS[e.action] ?? e.action, actor: e.actor, at: fmtAt(e.at) };
}

function OverrideForm({ missionCrewId, reasons }: { missionCrewId: string; reasons: string[] }) {
  const [open, setOpen] = useState(false);
  if (!open) return <Button variant="ghost" onClick={() => setOpen(true)}>Override…</Button>;
  return (
    <form action={overrideCrewAction} className="mt-1 flex flex-col gap-1.5">
      <input type="hidden" name="missionCrewId" value={missionCrewId} />
      <span className="text-micro text-fg-muted">Override: {reasons.join("; ")}</span>
      <Input name="reason" placeholder="Justification (logged to audit)" required className="w-64" />
      <span className="flex gap-2">
        <Button type="submit" variant="danger">Log override</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </span>
    </form>
  );
}

function KV({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-micro text-fg-muted">{k}</span>
      <span className={`text-small text-fg-primary ${mono ? "font-mono tabular-nums" : ""}`}>{v}</span>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1 text-small"><span className="text-fg-muted">{label}</span>{children}</label>;
}
function Gate({ label, detail }: { label: string; detail: string }) {
  return <div className="flex items-center justify-between border-t border-subtle py-1.5 text-small first:border-t-0"><span>{label}</span><span className="text-micro text-fg-muted">{detail}</span></div>;
}
function ReqLine({ k, v, muted }: { k: string; v: number; muted?: boolean }) {
  return <div className={`flex items-center justify-between border-t border-subtle py-1 text-small first:border-t-0 ${muted ? "text-fg-muted" : ""}`}><span>{k}</span><span className="font-mono tabular-nums">{muted && v === 0 ? "excluded" : v}</span></div>;
}
