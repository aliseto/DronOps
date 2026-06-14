"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Button,
  Card,
  DataTable,
  Drawer,
  EmptyState,
  Input,
  ReadinessVerdict,
  Select,
  StatusPill,
  Tabs,
  Timeline,
  type Column,
  type StatusVocab,
  type TimelineEvent,
} from "@dronops/ui";
import {
  addCredentialAction,
  addPersonAction,
  logDutyAction,
  logRecencyAction,
  overrideReadinessAction,
  renewCredentialAction,
  verifyCredentialAction,
} from "./actions";

type Verdict = StatusVocab["readiness"];
type Currency = StatusVocab["currency"];

interface CrewRow {
  id: string;
  name: string;
  identityNo: string | null;
  employmentStatus: string;
  roles: string[];
  airframeClasses: string[];
  primaryClass: string | null;
  verdict: Verdict;
  blocksAssignment: boolean;
  recencyCount: number;
  recencyRequired: number;
  expiring90: number;
  nextExpiry: string | null;
  hasWallet: boolean;
}

interface CheckView {
  key: string;
  label: string;
  status: Currency;
  clause?: string;
  detail?: string;
  reasonKind?: string;
}
interface ReadinessCard {
  airframeClass: string;
  jurisdiction: string;
  jurisdictionLabel: string;
  verdict: Verdict;
  blocksAssignment: boolean;
  checks: CheckView[];
}
interface CredView {
  id: string;
  kind: string;
  jurisdiction: string | null;
  authority: string | null;
  credentialNo: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  verified: boolean;
  status: string;
}
interface RecencyView {
  id: string;
  eventType: string;
  airframeClass: string | null;
  occurredAt: string;
  source: string;
}
interface Detail {
  person: {
    id: string;
    name: string;
    identityNo: string | null;
    email: string | null;
    phone: string | null;
    employmentStatus: string;
    employmentEndAt: string | null;
  };
  roles: string[];
  airframeClasses: string[];
  operatorRule: { minFlights: number; windowDays: number };
  readiness: ReadinessCard[];
  duty: {
    status: string;
    blockTime: string;
    clause?: string;
    breaches: { kind: string; detail: string }[];
    schemeJurisdiction: string | null;
    records: {
      id: string;
      startAt: string;
      endAt: string;
      missionRef: string | null;
      planned: boolean;
      extraFlightAreas: number;
    }[];
  };
  credentials: CredView[];
  recency: RecencyView[];
}
interface KindOpt {
  code: string;
  label: string;
  jurisdiction: string | null;
  expires: boolean;
}

const VERDICT_ORDER: Verdict[] = ["not-fit", "unknown", "caution", "fit"];
const fmtDate = (iso: string | null) => (iso ? iso.slice(0, 10) : "—");
const ROLE_LABEL = (r: string) => r.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

export function PersonnelView({
  crew,
  exceptions,
  canManage,
  credentialKinds,
  detail,
  history,
}: {
  crew: CrewRow[];
  exceptions: { blocking: number; expiringSoon: number };
  canManage: boolean;
  credentialKinds: KindOpt[];
  detail: Detail | null;
  history: TimelineEvent[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [verdictFilter, setVerdictFilter] = useState<string>("all");
  const [adding, setAdding] = useState(false);

  const open = (id: string) => router.push(`${pathname}?panel=person:${id}`);
  const close = () => router.push(pathname);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return crew.filter((c) => {
      if (verdictFilter === "blocking" && !c.blocksAssignment) return false;
      if (verdictFilter !== "all" && verdictFilter !== "blocking" && c.verdict !== verdictFilter) return false;
      if (!needle) return true;
      return (
        c.name.toLowerCase().includes(needle) ||
        (c.identityNo ?? "").toLowerCase().includes(needle) ||
        c.airframeClasses.some((a) => a.toLowerCase().includes(needle))
      );
    });
  }, [crew, q, verdictFilter]);

  const columns: Column<CrewRow>[] = [
    {
      key: "person",
      header: "Person",
      width: "1.6fr",
      accessor: (r) => r.name,
      sortable: true,
      cell: (r) => (
        <span className="flex flex-col">
          <span className="font-medium text-fg-primary">{r.name}</span>
          <span className="text-micro text-fg-muted font-mono tabular-nums">
            {[r.identityNo, r.airframeClasses.join(", ") || "no class"].filter(Boolean).join(" · ")}
          </span>
        </span>
      ),
    },
    {
      key: "roles",
      header: "Roles",
      width: "1fr",
      cell: (r) => (
        <span className="text-small text-fg-muted">{r.roles.map(ROLE_LABEL).join(", ") || "—"}</span>
      ),
    },
    {
      key: "readiness",
      header: "Readiness",
      width: "1.2fr",
      accessor: (r) => VERDICT_ORDER.indexOf(r.verdict),
      sortable: true,
      cell: (r) => (
        <span className="flex items-center gap-2">
          <StatusPill domain="readiness" status={r.verdict} />
          {r.blocksAssignment && (
            <span className="text-micro font-medium text-status-danger-fg">Blocks</span>
          )}
        </span>
      ),
    },
    {
      key: "recency",
      header: "Recency",
      width: "0.7fr",
      accessor: (r) => r.recencyCount,
      cell: (r) => (
        <span className="text-small text-fg-muted">
          <span className="font-mono tabular-nums text-fg-secondary">
            {r.recencyCount}/{r.recencyRequired}
          </span>{" "}
          flights
        </span>
      ),
    },
    {
      key: "expiring",
      header: "≤90 d",
      width: "0.6fr",
      accessor: (r) => r.expiring90,
      sortable: true,
      cell: (r) =>
        r.expiring90 > 0 ? (
          <span className="text-small text-status-warn-fg font-mono tabular-nums">{r.expiring90}</span>
        ) : (
          <span className="text-small text-fg-muted">—</span>
        ),
    },
    {
      key: "nextExpiry",
      header: "Next expiry",
      width: "0.8fr",
      accessor: (r) => r.nextExpiry ?? "",
      sortable: true,
      cell: (r) =>
        r.hasWallet ? (
          <span className="text-small text-fg-muted font-mono tabular-nums">{fmtDate(r.nextExpiry)}</span>
        ) : (
          <span className="text-micro text-status-warn-fg">No wallet — obtain</span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-display text-fg-primary">Crew roster</h1>
          <p className="text-small text-fg-muted">
            Fitness to fly is computed live from the credential wallet and recency events — per person,
            per airframe class, per jurisdiction.
          </p>
        </div>
        {canManage && (
          <Button variant="primary" onClick={() => setAdding((v) => !v)}>
            + Add person
          </Button>
        )}
      </div>

      {/* Role-aware exceptions (UX_SYSTEM §1.3). */}
      {(exceptions.blocking > 0 || exceptions.expiringSoon > 0) && (
        <div className="flex flex-wrap gap-2 text-small">
          {exceptions.blocking > 0 && (
            <span className="rounded-md bg-status-danger-bg px-3 py-1.5 text-status-danger-fg">
              <span className="font-mono tabular-nums">{exceptions.blocking}</span> blocking assignment
            </span>
          )}
          {exceptions.expiringSoon > 0 && (
            <span className="rounded-md bg-status-warn-bg px-3 py-1.5 text-status-warn-fg">
              <span className="font-mono tabular-nums">{exceptions.expiringSoon}</span> credentials expiring ≤90 d
            </span>
          )}
        </div>
      )}

      {adding && canManage && (
        <Card title="Add person">
          <form action={addPersonAction} className="flex flex-wrap items-end gap-3" onSubmit={() => setTimeout(() => setAdding(false), 0)}>
            <label className="flex flex-col gap-1 text-small">
              <span className="text-fg-muted">Name</span>
              <Input name="name" required />
            </label>
            <label className="flex flex-col gap-1 text-small">
              <span className="text-fg-muted">Identity no.</span>
              <Input name="identityNo" />
            </label>
            <label className="flex flex-col gap-1 text-small">
              <span className="text-fg-muted">Email</span>
              <Input name="email" type="email" />
            </label>
            <Button type="submit" variant="primary">
              Add
            </Button>
          </form>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search name, ID or class…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={verdictFilter}
          onChange={(e) => setVerdictFilter(e.target.value)}
          options={[
            { value: "all", label: "All readiness" },
            { value: "blocking", label: "Blocks assignment" },
            { value: "fit", label: "Fit to fly" },
            { value: "caution", label: "Caution" },
            { value: "not-fit", label: "Not fit" },
            { value: "unknown", label: "Unknown" },
          ]}
        />
        <span className="text-micro text-fg-muted">
          {rows.length} of {crew.length}
        </span>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        onRowClick={(r) => open(r.id)}
        csvFileName="crew-roster"
        empty={<EmptyState title="No crew yet" description="Add people to start tracking currency." />}
      />

      {detail && (
        <PersonDrawer
          detail={detail}
          history={history}
          canManage={canManage}
          credentialKinds={credentialKinds}
          onClose={close}
        />
      )}
    </div>
  );
}

function PersonDrawer({
  detail,
  history,
  canManage,
  credentialKinds,
  onClose,
}: {
  detail: Detail;
  history: TimelineEvent[];
  canManage: boolean;
  credentialKinds: KindOpt[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState("overview");
  const overall = useMemo<Verdict>(() => {
    for (const v of VERDICT_ORDER) if (detail.readiness.some((c) => c.verdict === v)) return v;
    return "unknown";
  }, [detail.readiness]);
  const blocks = detail.readiness.some((c) => c.blocksAssignment) || detail.readiness.length === 0;

  return (
    <Drawer
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-3">
          <span>{detail.person.name}</span>
          <StatusPill domain="readiness" status={detail.readiness.length === 0 ? "unknown" : overall} />
          {blocks && <span className="text-micro font-medium text-status-danger-fg">Blocks assignment</span>}
        </span>
      }
    >
      <div className="mb-3 flex flex-wrap gap-4 text-micro text-fg-muted">
        {detail.person.identityNo && (
          <span className="font-mono tabular-nums">{detail.person.identityNo}</span>
        )}
        <span>{detail.roles.map(ROLE_LABEL).join(", ") || "No domain roles"}</span>
        <span>Employment: {detail.person.employmentStatus}</span>
      </div>

      <Tabs
        value={tab}
        onValueChange={setTab}
        items={[
          { value: "overview", label: "Overview" },
          { value: "credentials", label: "Credentials" },
          { value: "recency", label: "Recency" },
          { value: "duty", label: "Duty & rest" },
          { value: "history", label: "History" },
        ]}
      />

      {tab === "overview" && (
        <OverviewTab detail={detail} canManage={canManage} />
      )}
      {tab === "credentials" && (
        <CredentialsTab detail={detail} canManage={canManage} credentialKinds={credentialKinds} />
      )}
      {tab === "recency" && <RecencyTab detail={detail} canManage={canManage} />}
      {tab === "duty" && <DutyTab detail={detail} canManage={canManage} />}
      {tab === "history" && (
        <div className="pt-3">
          {history.length ? <Timeline events={history} /> : <p className="text-small text-fg-muted">No history yet.</p>}
        </div>
      )}
    </Drawer>
  );
}

function OverviewTab({ detail, canManage }: { detail: Detail; canManage: boolean }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [override, setOverride] = useState<string | null>(null);
  const toggle = (k: string) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  if (detail.readiness.length === 0) {
    return (
      <div className="pt-3">
        <EmptyState
          title="No flying requirements resolved"
          description="No airframe class on record, or no flying jurisdiction enabled. Currency is Unknown — this blocks assignment until a wallet and recency exist."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 pt-3">
      {detail.readiness.map((card) => {
        const k = `${card.airframeClass}|${card.jurisdiction}`;
        const isOpen = expanded.has(k);
        return (
          <div key={k} className="rounded-md border border-default">
            <button
              type="button"
              onClick={() => toggle(k)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-start hover:bg-hover"
            >
              <span className="flex flex-col">
                <span className="text-body text-fg-primary">
                  {card.airframeClass} · {card.jurisdictionLabel}
                </span>
                <span className="text-micro text-fg-muted">{isOpen ? "Hide" : "Show"} contributing credentials</span>
              </span>
              <span className="flex items-center gap-2">
                {card.blocksAssignment && <span className="text-micro font-medium text-status-danger-fg">Blocks</span>}
                <StatusPill domain="readiness" status={card.verdict} />
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-subtle px-3 py-3">
                <ReadinessVerdict
                  verdict={card.verdict}
                  blocksAssignment={card.blocksAssignment}
                  checks={card.checks.map((c) => ({
                    key: c.key,
                    label: c.label,
                    status: c.status,
                    clause: c.clause,
                    detail: c.detail,
                  }))}
                />
                {canManage && card.blocksAssignment && (
                  <div className="mt-3">
                    {override === k ? (
                      <form action={overrideReadinessAction} className="flex flex-col gap-2">
                        <input type="hidden" name="personId" value={detail.person.id} />
                        <input type="hidden" name="airframeClass" value={card.airframeClass} />
                        <input type="hidden" name="jurisdiction" value={card.jurisdiction} />
                        <Input name="reason" placeholder="Justification (logged to audit)" required />
                        <div className="flex gap-2">
                          <Button type="submit" variant="danger">
                            Log override
                          </Button>
                          <Button type="button" variant="ghost" onClick={() => setOverride(null)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <Button variant="ghost" onClick={() => setOverride(k)}>
                        Override with justification…
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      <DutySummary detail={detail} />
    </div>
  );
}

function DutySummary({ detail }: { detail: Detail }) {
  const tone =
    detail.duty.status === "breach"
      ? "text-status-danger-fg"
      : detail.duty.status === "ok"
        ? "text-status-ok-fg"
        : "text-fg-muted"; // not-applicable / no-scheme are neutral, never amber
  const label =
    detail.duty.status === "not-applicable"
      ? "Not applicable (no specific-category Dubai ops)"
      : detail.duty.status === "no-scheme"
        ? "No duty scheme in enabled jurisdictions"
        : detail.duty.status === "breach"
          ? `${detail.duty.breaches.length} breach(es)`
          : "Within limits";
  return (
    <div className="mt-1 flex items-center justify-between rounded-md border border-default px-3 py-2.5">
      <span className="flex flex-col">
        <span className="text-body text-fg-primary">Duty &amp; rest</span>
        <span className="text-micro text-fg-muted">{detail.duty.clause ?? "DUOSAM OSO#17"}</span>
      </span>
      <span className={`text-small ${tone}`}>{label}</span>
    </div>
  );
}

function CredentialsTab({
  detail,
  canManage,
  credentialKinds,
}: {
  detail: Detail;
  canManage: boolean;
  credentialKinds: KindOpt[];
}) {
  const [renewing, setRenewing] = useState<string | null>(null);
  const active = detail.credentials.filter((c) => c.status === "active");
  const kindLabel = (code: string) => credentialKinds.find((k) => k.code === code)?.label ?? code;

  return (
    <div className="flex flex-col gap-4 pt-3">
      {active.length === 0 ? (
        <EmptyState
          title="No credentials on file"
          description="This person has no wallet — fitness is Unknown and blocks assignment. Add their licence/certificate/medical."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {active.map((c) => {
            const status: Currency = !c.expiresAt
              ? c.verified
                ? "current"
                : "unverified"
              : new Date(c.expiresAt) < new Date()
                ? "lapsed"
                : !c.verified
                  ? "unverified"
                  : "current";
            return (
              <li key={c.id} className="rounded-md border border-default px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex flex-col">
                    <span className="text-body text-fg-primary">{kindLabel(c.kind)}</span>
                    <span className="text-micro text-fg-muted font-mono tabular-nums">
                      {[c.authority, c.credentialNo, c.expiresAt ? `exp ${fmtDate(c.expiresAt)}` : "no expiry"]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <StatusPill domain="currency" status={status} />
                    {canManage && !c.verified && (
                      <Button variant="ghost" onClick={() => verifyCredentialAction(c.id)}>
                        Verify
                      </Button>
                    )}
                    {canManage && (
                      <Button variant="ghost" onClick={() => setRenewing(renewing === c.id ? null : c.id)}>
                        Renew
                      </Button>
                    )}
                  </span>
                </div>
                {renewing === c.id && (
                  <form action={renewCredentialAction} className="mt-3 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="credentialId" value={c.id} />
                    <label className="flex flex-col gap-1 text-micro text-fg-muted">
                      New no.<Input name="credentialNo" defaultValue={c.credentialNo ?? ""} />
                    </label>
                    <label className="flex flex-col gap-1 text-micro text-fg-muted">
                      Issued<Input name="issuedAt" type="date" />
                    </label>
                    <label className="flex flex-col gap-1 text-micro text-fg-muted">
                      Expires<Input name="expiresAt" type="date" />
                    </label>
                    <Button type="submit" variant="primary">
                      Save renewal
                    </Button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canManage && (
        <Card title="Add credential">
          <form action={addCredentialAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="personId" value={detail.person.id} />
            <label className="flex flex-col gap-1 text-small">
              <span className="text-fg-muted">Kind</span>
              <Select
                name="kind"
                required
                options={credentialKinds.map((k) => ({ value: k.code, label: k.label }))}
              />
            </label>
            <label className="flex flex-col gap-1 text-small">
              <span className="text-fg-muted">No.</span>
              <Input name="credentialNo" />
            </label>
            <label className="flex flex-col gap-1 text-small">
              <span className="text-fg-muted">Issued</span>
              <Input name="issuedAt" type="date" />
            </label>
            <label className="flex flex-col gap-1 text-small">
              <span className="text-fg-muted">Expires</span>
              <Input name="expiresAt" type="date" />
            </label>
            <Button type="submit" variant="primary">
              Add
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}

function RecencyTab({ detail, canManage }: { detail: Detail; canManage: boolean }) {
  return (
    <div className="flex flex-col gap-4 pt-3">
      <p className="text-micro text-fg-muted">
        Operator rule: {detail.operatorRule.minFlights} flights / {detail.operatorRule.windowDays} d per airframe
        class. Source-tagged; M6 flight reconciliation writes these automatically once live.
      </p>
      {detail.recency.length === 0 ? (
        <EmptyState title="No recency events" description="Log flights or knowledge-recency events to build currency." />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {detail.recency.map((e) => (
            <li key={e.id} className="flex items-center justify-between rounded-md border border-default px-3 py-2 text-small">
              <span className="flex flex-col">
                <span className="text-fg-primary">
                  {e.eventType === "flight" ? `Flight — ${e.airframeClass ?? "unspecified"}` : ROLE_LABEL(e.eventType)}
                </span>
                <span className="text-micro text-fg-muted font-mono tabular-nums">
                  {fmtDate(e.occurredAt)} · {e.source}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {canManage && (
        <Card title="Log recency event">
          <form action={logRecencyAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="personId" value={detail.person.id} />
            <label className="flex flex-col gap-1 text-small">
              <span className="text-fg-muted">Type</span>
              <Select
                name="eventType"
                defaultValue="flight"
                options={[
                  { value: "flight", label: "Flight" },
                  { value: "knowledge_recency", label: "Knowledge recency" },
                ]}
              />
            </label>
            <label className="flex flex-col gap-1 text-small">
              <span className="text-fg-muted">Airframe class</span>
              <Input name="airframeClass" placeholder="e.g. multirotor" />
            </label>
            <label className="flex flex-col gap-1 text-small">
              <span className="text-fg-muted">Date</span>
              <Input name="occurredAt" type="date" required />
            </label>
            <Button type="submit" variant="primary">
              Log
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}

function DutyTab({ detail, canManage }: { detail: Detail; canManage: boolean }) {
  return (
    <div className="flex flex-col gap-4 pt-3">
      <DutySummary detail={detail} />
      {detail.duty.status === "not-applicable" && (
        <p className="rounded-md border border-default px-3 py-2 text-micro text-fg-muted">
          DUOSAM OSO#17 duty/rest binds to UAE-Dubai specific-category operations. This person isn’t covered, so
          duty limits don’t apply — distinct from “not configured”. M4 will set coverage per specific-category
          assignment.
        </p>
      )}
      {detail.duty.status !== "not-applicable" && detail.duty.status !== "no-scheme" && (
        <p className="rounded-md border border-default px-3 py-2 text-micro text-fg-muted">
          OSO#17 live: duty ≤ 780 min/day (−60/extra area), rest ≥ max(last duty, 480 min), ≥1 day off / 7 d.
          Block time (≤240 min/day) is <span className="text-fg-secondary">awaiting M6</span> flight records — not
          evaluated yet, and never reported as a pass.
        </p>
      )}
      {detail.duty.breaches.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {detail.duty.breaches.map((b, i) => (
            <li key={i} className="rounded-md bg-status-danger-bg px-3 py-2 text-small text-status-danger-fg">
              {b.detail}
            </li>
          ))}
        </ul>
      )}
      {detail.duty.records.length === 0 ? (
        <EmptyState title="No duty records" description="Log duty periods to project rest and breaches." />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {detail.duty.records.map((d) => (
            <li key={d.id} className="flex items-center justify-between rounded-md border border-default px-3 py-2 text-small">
              <span className="font-mono tabular-nums text-fg-secondary">
                {d.startAt.slice(0, 16).replace("T", " ")} → {d.endAt.slice(11, 16)}
                {d.extraFlightAreas > 0 && (
                  <span className="ms-2 text-micro text-fg-muted">+{d.extraFlightAreas} area(s)</span>
                )}
              </span>
              <span className="text-micro text-fg-muted">{d.missionRef ?? (d.planned ? "planned" : "logged")}</span>
            </li>
          ))}
        </ul>
      )}
      {canManage && (
        <Card title="Log duty period">
          <form action={logDutyAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="personId" value={detail.person.id} />
            <label className="flex flex-col gap-1 text-small">
              <span className="text-fg-muted">Start</span>
              <Input name="startAt" type="datetime-local" required />
            </label>
            <label className="flex flex-col gap-1 text-small">
              <span className="text-fg-muted">End</span>
              <Input name="endAt" type="datetime-local" required />
            </label>
            <label className="flex flex-col gap-1 text-small">
              <span className="text-fg-muted">Extra areas</span>
              <Input name="extraFlightAreas" type="number" min={0} defaultValue={0} className="w-24" />
            </label>
            <label className="flex flex-col gap-1 text-small">
              <span className="text-fg-muted">Mission ref</span>
              <Input name="missionRef" />
            </label>
            <Button type="submit" variant="primary">
              Log
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
