import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { hasAnyRole } from "@/server/rbac";
import { getEntityHistory } from "@/server/history";
import { listCrew, getPersonDetail, CREDENTIAL_KINDS } from "@/server/personnel";
import { PersonnelView } from "./PersonnelView";

export default async function PersonnelPage({
  searchParams,
}: {
  searchParams: Promise<{ panel?: string }>;
}) {
  const user = await getCurrentUser();
  const orgId = user?.id ? await getActiveOrgId(user.id) : null;

  const crew = orgId ? await listCrew(orgId) : [];
  const canManage =
    orgId && user?.id
      ? await hasAnyRole(orgId, user.id, ["quality_manager", "accountable_manager", "ops_manager"])
      : false;

  const sp = await searchParams;
  const personId = sp.panel?.startsWith("person:") ? sp.panel.slice(7) : undefined;
  const detail = orgId && personId ? await getPersonDetail(orgId, personId) : null;
  const history = orgId && personId ? await getEntityHistory(orgId, "person", personId) : [];

  // Role-aware exceptions (UX_SYSTEM §1.3): people who block assignment now.
  const blocking = crew.filter((c) => c.blocksAssignment).length;
  const expiringSoon = crew.reduce((n, c) => n + c.expiring90, 0);

  return (
    <PersonnelView
      crew={crew.map((c) => ({ ...c, nextExpiry: c.nextExpiry }))}
      exceptions={{ blocking, expiringSoon }}
      canManage={canManage}
      credentialKinds={CREDENTIAL_KINDS.map((k) => ({
        code: k.code,
        label: k.label,
        jurisdiction: k.jurisdiction,
        expires: k.expires,
      }))}
      detail={
        detail
          ? {
              person: detail.person,
              roles: detail.roles,
              airframeClasses: detail.airframeClasses,
              operatorRule: {
                minFlights: detail.operatorRule.minFlights,
                windowDays: detail.operatorRule.windowDays,
              },
              readiness: detail.readiness.map((r) => ({
                airframeClass: r.airframeClass,
                jurisdiction: r.jurisdiction,
                jurisdictionLabel: r.jurisdictionLabel,
                verdict: r.verdict.verdict,
                blocksAssignment: r.verdict.blocksAssignment,
                checks: r.verdict.checks.map((c) => ({
                  key: c.key,
                  label: c.label,
                  status: c.status,
                  clause: c.clause,
                  detail: c.detail,
                  reasonKind: c.reasonKind,
                })),
              })),
              duty: {
                status: detail.duty.projection.status,
                clause: detail.duty.projection.clause,
                breaches: detail.duty.projection.breaches.map((b) => ({ kind: b.kind, detail: b.detail })),
                schemeJurisdiction: detail.duty.schemeJurisdiction,
                records: detail.duty.records.map((d) => ({
                  id: d.id,
                  startAt: d.startAt.toISOString(),
                  endAt: d.endAt.toISOString(),
                  missionRef: d.missionRef,
                  planned: d.planned,
                })),
              },
              credentials: detail.credentials.map((c) => ({
                id: c.id,
                kind: c.kind,
                jurisdiction: c.jurisdiction,
                authority: c.authority,
                credentialNo: c.credentialNo,
                issuedAt: c.issuedAt ? c.issuedAt.toISOString() : null,
                expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
                verified: c.verified,
                status: c.status,
              })),
              recency: detail.recency.map((e) => ({
                id: e.id,
                eventType: e.eventType,
                airframeClass: e.airframeClass,
                occurredAt: e.occurredAt.toISOString(),
                source: e.source,
              })),
            }
          : null
      }
      history={history}
    />
  );
}
