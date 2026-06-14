import "server-only";
import {
  groupObligations,
  obligationSeverity,
  type GroupedObligations,
  type Obligation,
} from "@dronops/shared";
import { getCurrentPersonId, hasAnyRole } from "./rbac";
import { myAcksDue } from "./distributions";
import { listDocuments } from "./documents";
import { listFindings } from "./compliance";
import { listOccurrences } from "./safety";
import { listMissions } from "./operations";
import { listFleet } from "./fleet";
import { listFlights } from "./flight-evidence";
import { listCrew } from "./personnel";

/**
 * The P0 obligations inbox (UX_SYSTEM §1.3/§9): one aggregation over each
 * module's EXISTING exception logic — no new domain rules live here. Counts
 * are real (the dashboard renders from this same query). Role-aware: org-wide
 * duties (approvals, triage, fleet, crew) appear for QM/AM/ops; personal acks
 * appear for everyone. Best-effort per module — one failing source must not
 * blank the inbox (each section degrades to empty, like the module pages).
 */
export async function listObligations(orgId: string, userId: string): Promise<GroupedObligations> {
  const now = new Date();
  const personId = await getCurrentPersonId(orgId, userId).catch(() => null);
  const manager = await hasAnyRole(orgId, userId, [
    "quality_manager",
    "accountable_manager",
    "ops_manager",
  ]).catch(() => false);
  const approver = await hasAnyRole(orgId, userId, [
    "quality_manager",
    "accountable_manager",
  ]).catch(() => false);

  const out: Obligation[] = [];
  const add = (o: Omit<Obligation, "severity"> & { overdue?: boolean }) =>
    out.push({
      ...o,
      severity: o.overdue ? "overdue" : obligationSeverity(o.dueAt, now),
    });
  const attempt = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch {
      /* section degrades to empty — module pages behave the same */
    }
  };

  // M1 — my acknowledgements (personal, everyone)
  await attempt(async () => {
    if (!personId) return;
    for (const a of await myAcksDue(orgId, personId)) {
      add({
        key: `ack:${a.distributionId}`,
        kind: "ack_due",
        title: `Acknowledge ${a.docNo} rev ${a.revNo} — ${a.title}`,
        dueAt: a.dueAt,
        overdue: a.overdue,
        href: "/documents",
      });
    }
  });

  // M1 — approvals waiting + external review-due (QM/AM)
  await attempt(async () => {
    if (!approver) return;
    for (const d of await listDocuments(orgId)) {
      const p = d.status.primary;
      const inReview =
        (p.kind === "approval" && p.status === "in_review") ||
        d.status.inFlight?.status === "in_review";
      if (inReview) {
        add({
          key: `doc-review:${d.id}`,
          kind: "doc_in_review",
          title: `Approve ${d.docNo} — ${d.title}`,
          dueAt: null,
          href: `/documents?panel=doc:${d.id}`,
        });
      }
      if (p.kind === "external" && p.status !== "valid") {
        add({
          key: `doc-due:${d.id}`,
          kind: "doc_review_due",
          title: `Review external document ${d.docNo} — ${d.title}`,
          dueAt: d.reviewDueAt ? new Date(d.reviewDueAt) : null,
          overdue: p.status === "expired",
          href: `/documents?panel=doc:${d.id}`,
        });
      }
    }
  });

  // M2 — finding triage + CAPA deadlines (QM/AM)
  await attempt(async () => {
    if (!approver) return;
    for (const f of await listFindings(orgId)) {
      if (f.untriaged) {
        add({
          key: `triage:${f.id}`,
          kind: "finding_triage",
          title: `Triage ${f.code} — ${f.title}`,
          detail: f.deviationCode ?? undefined,
          dueAt: null,
          href: `/compliance/findings/${f.id}`,
        });
      } else if (!["closed", "false-positive"].includes(f.status) && f.dueAt) {
        add({
          key: `capa:${f.id}`,
          kind: "capa_due",
          title: `Close ${f.code} — ${f.title}`,
          dueAt: new Date(f.dueAt),
          href: `/compliance/findings/${f.id}`,
        });
      }
    }
  });

  // M3 — occurrence reporting clocks (QM/AM; regulator deadlines)
  await attempt(async () => {
    if (!approver) return;
    for (const o of await listOccurrences(orgId)) {
      if (!o.deadline.applicable || o.deadline.satisfied) continue;
      add({
        key: `occurrence:${o.id}`,
        kind: "occurrence_deadline",
        title: `Report ${o.code} — ${o.title}`,
        detail: o.deadline.clause ?? undefined,
        dueAt: o.deadline.dueAt ? new Date(o.deadline.dueAt) : null,
        overdue: o.deadline.overdue,
        href: `/safety/occurrences/${o.id}`,
      });
    }
  });

  // M4 — missions awaiting approval / crew-blocked (managers)
  await attempt(async () => {
    if (!manager) return;
    for (const m of await listMissions(orgId)) {
      if (m.status === "submitted_for_approval" || m.status === "approval_in_progress") {
        add({
          key: `mission-approval:${m.id}`,
          kind: "mission_approval",
          title: `Progress authority approval for ${m.code} — ${m.title}`,
          dueAt: m.plannedStartAt ? new Date(m.plannedStartAt) : null,
          href: `/operations/${m.id}`,
        });
      }
      if (m.blockingCrew > 0 && !["flown", "rejected", "withdrawn"].includes(m.status)) {
        add({
          key: `mission-crew:${m.id}`,
          kind: "mission_crew_blocked",
          title: `Resolve ${m.blockingCrew} blocked crew on ${m.code} — ${m.title}`,
          dueAt: m.plannedStartAt ? new Date(m.plannedStartAt) : null,
          href: `/operations/${m.id}`,
        });
      }
    }
  });

  // M5 — grounded aircraft, registration windows, overdue maintenance (managers)
  await attempt(async () => {
    if (!manager) return;
    for (const a of await listFleet(orgId)) {
      if (a.status === "grounded") {
        add({
          key: `fleet-grounded:${a.id}`,
          kind: "fleet_grounded",
          title: `Return ${a.label} to service`,
          dueAt: null,
          href: "/fleet",
        });
      }
      if (a.registrationStatus === "expiring" || a.registrationStatus === "lapsed") {
        add({
          key: `fleet-reg:${a.id}`,
          kind: "fleet_registration",
          title: `Renew registration for ${a.label}`,
          dueAt: a.registrationExpiresAt ? new Date(a.registrationExpiresAt) : null,
          overdue: a.registrationStatus === "lapsed",
          href: "/fleet",
        });
      }
      if (a.maintenanceOverdue) {
        add({
          key: `fleet-maint:${a.id}`,
          kind: "maintenance_overdue",
          title: `Perform overdue maintenance on ${a.label}`,
          dueAt: a.nextMaintenanceDueAt ? new Date(a.nextMaintenanceDueAt) : null,
          overdue: true,
          href: "/fleet",
        });
      }
    }
  });

  // M6 — unsealed flight evidence (managers)
  await attempt(async () => {
    if (!manager) return;
    for (const f of await listFlights(orgId)) {
      if (f.status === "sealed") continue;
      add({
        key: `flight:${f.id}`,
        kind: "flight_unsealed",
        title: `Reconcile and seal flight on ${f.aircraftLabel}`,
        detail: f.deviationCount > 0 ? `${f.deviationCount} deviation(s)` : undefined,
        dueAt: null,
        href: "/evidence",
      });
    }
  });

  // M7 — crew blocked from assignment / credentials expiring (managers)
  await attempt(async () => {
    if (!manager) return;
    for (const c of await listCrew(orgId)) {
      if (c.blocksAssignment) {
        add({
          key: `crew-blocked:${c.id}`,
          kind: "crew_blocked",
          title: `Restore readiness for ${c.name}`,
          dueAt: null,
          href: "/personnel",
        });
      } else if (c.expiring90 > 0) {
        add({
          key: `crew-expiring:${c.id}`,
          kind: "credential_expiring",
          title: `Renew ${c.expiring90} expiring credential(s) for ${c.name}`,
          dueAt: c.nextExpiry ? new Date(c.nextExpiry) : null,
          href: "/personnel",
        });
      }
    }
  });

  return groupObligations(out);
}
