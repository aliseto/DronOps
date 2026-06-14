import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getDocumentWithRevisions, listDocuments } from "@/server/documents";
import { getCurrentPersonId, getPersonRoles, hasAnyRole } from "@/server/rbac";
import { getEntityHistory } from "@/server/history";
import { listDistributionsForRevision, listPersons } from "@/server/distributions";
import { DocumentsView } from "./DocumentsView";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ panel?: string }>;
}) {
  const user = await getCurrentUser();

  // Best-effort like the other module pages: the register must render (empty)
  // when the data layer is unavailable, never error.
  let orgId: string | null = null;
  let docs: Awaited<ReturnType<typeof listDocuments>> = [];
  let canApprove = false;
  let personId: string | null = null;
  try {
    orgId = user?.id ? await getActiveOrgId(user.id) : null;
    docs = orgId ? await listDocuments(orgId) : [];
    canApprove =
      orgId && user?.id
        ? await hasAnyRole(orgId, user.id, ["quality_manager", "accountable_manager"])
        : false;
    personId = orgId && user?.id ? await getCurrentPersonId(orgId, user.id) : null;
  } catch {
    /* degrade to empty register */
  }

  // Role-aware personal obligations (UX_SYSTEM §1.3 — not org totals).
  const inReview = canApprove
    ? docs.filter(
        (d) =>
          (d.status.primary.kind === "approval" && d.status.primary.status === "in_review") ||
          d.status.inFlight?.status === "in_review",
      ).length
    : null;
  const reviewDue = docs.filter(
    (d) =>
      d.status.primary.kind === "external" &&
      d.status.primary.status !== "valid" &&
      (canApprove || (personId != null && d.ownerPersonId === personId)),
  ).length;

  const sp = await searchParams;
  const docId = sp.panel?.startsWith("doc:") ? sp.panel.slice(4) : undefined;
  let detail: Awaited<ReturnType<typeof getDocumentWithRevisions>> = null;
  let history: Awaited<ReturnType<typeof getEntityHistory>> = [];
  let distributions: Awaited<ReturnType<typeof listDistributionsForRevision>> = [];
  let people: Awaited<ReturnType<typeof listPersons>> = [];
  let currentRev: { id: string } | null = null;
  try {
    detail = orgId && docId ? await getDocumentWithRevisions(orgId, docId) : null;
    history = orgId && docId ? await getEntityHistory(orgId, "document", docId) : [];

    // Distribution context for the open document's current approved revision.
    const approvedRev = detail?.revisions.find((r) => r.status === "approved") ?? null;
    currentRev = approvedRev ? { id: approvedRev.id } : null;
    const viewerRoles = orgId && personId ? await getPersonRoles(orgId, personId) : [];
    distributions =
      orgId && currentRev
        ? await listDistributionsForRevision(
            orgId,
            currentRev.id,
            personId ? { personId, roles: viewerRoles } : undefined,
          )
        : [];
    people = orgId && detail ? await listPersons(orgId) : [];
  } catch {
    /* degrade: drawer simply does not open */
  }

  return (
    <DocumentsView
      currentRevisionId={currentRev?.id ?? null}
      persons={people}
      distributions={distributions.map((d) => ({
        ...d,
        dueAt: d.dueAt ? d.dueAt.toISOString() : null,
      }))}
      docs={docs.map((d) => ({
        id: d.id,
        docNo: d.docNo,
        category: d.category,
        title: d.title,
        reviewDueAt: d.reviewDueAt ? d.reviewDueAt.toISOString() : null,
        updatedAt: d.updatedAt.toISOString(),
        status: d.status,
      }))}
      exceptions={{ inReview, reviewDue }}
      detail={
        detail
          ? {
              document: {
                id: detail.document.id,
                docNo: detail.document.docNo,
                title: detail.document.title,
                category: detail.document.category,
              },
              revisions: detail.revisions.map((r) => ({
                id: r.id,
                revNo: r.revNo,
                status: r.status,
                changeSummary: r.changeSummary,
                effectiveAt: r.effectiveAt ? r.effectiveAt.toISOString() : null,
                bodyFileId: r.bodyFileId,
              })),
              requirements: detail.requirements,
            }
          : null
      }
      canApprove={canApprove}
      history={history}
    />
  );
}
