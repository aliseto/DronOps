import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getDocumentWithRevisions, listDocuments } from "@/server/documents";
import { getCurrentPersonId, hasAnyRole } from "@/server/rbac";
import { getEntityHistory } from "@/server/history";
import { DocumentsView } from "./DocumentsView";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ panel?: string }>;
}) {
  const user = await getCurrentUser();
  const orgId = user?.id ? await getActiveOrgId(user.id) : null;

  const docs = orgId ? await listDocuments(orgId) : [];
  const canApprove =
    orgId && user?.id
      ? await hasAnyRole(orgId, user.id, ["quality_manager", "accountable_manager"])
      : false;
  const personId = orgId && user?.id ? await getCurrentPersonId(orgId, user.id) : null;

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
  const detail = orgId && docId ? await getDocumentWithRevisions(orgId, docId) : null;
  const history = orgId && docId ? await getEntityHistory(orgId, "document", docId) : [];

  return (
    <DocumentsView
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
