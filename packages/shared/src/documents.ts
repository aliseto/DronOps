/**
 * Document-control vocabulary (locked product scoping). Records (flights, NCRs,
 * completed form instances) are NOT documents and never enter this system.
 */
export const DOCUMENT_CATEGORIES = [
  "manual",
  "procedure",
  "policy",
  "form_template",
  "training",
  "external",
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

/** Server-generated numbering prefix per category (e.g. MAN-001). */
export const CATEGORY_PREFIX: Record<DocumentCategory, string> = {
  manual: "MAN",
  procedure: "SOP",
  policy: "POL",
  form_template: "FRM",
  training: "TRN",
  external: "EXT",
};

export const CATEGORY_LABEL: Record<DocumentCategory, string> = {
  manual: "Manual",
  procedure: "Procedure",
  policy: "Policy",
  form_template: "Form template",
  training: "Training",
  external: "External",
};

/** External docs (certs, approvals, insurance) skip approval; track review-due. */
export function categorySkipsApproval(category: DocumentCategory): boolean {
  return category === "external";
}

export const isDocumentCategory = (v: string): v is DocumentCategory =>
  (DOCUMENT_CATEGORIES as readonly string[]).includes(v);

export type RevisionStatus = "draft" | "in_review" | "approved" | "obsolete";

/**
 * External documents (certs, approvals, insurance) have their OWN status model
 * driven by review_date — they never enter the approval lifecycle.
 */
export type ExternalStatus = "valid" | "review-due" | "expired";

export function externalStatus(
  reviewDueAt: Date | null,
  now: Date = new Date(),
  warnDays = 30,
): { status: ExternalStatus; days: number | null } {
  if (!reviewDueAt) return { status: "valid", days: null };
  const days = Math.ceil((reviewDueAt.getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return { status: "expired", days };
  if (days <= warnDays) return { status: "review-due", days };
  return { status: "valid", days };
}

/**
 * Explicit document-level status (the register must not conflate two meanings):
 * - external → its own valid / review-due / expired model.
 * - else: if a current APPROVED revision exists → "effective"; a newer in-flight
 *   revision is surfaced as a SECONDARY badge so an auditor never reads
 *   "Effective" and misses a pending change.
 * - else → the latest revision's status (draft / in_review).
 */
export interface DocumentStatusResult {
  primary:
    | { kind: "approval"; status: RevisionStatus }
    | { kind: "external"; status: ExternalStatus; days: number | null };
  inFlight?: { revNo: number; status: "draft" | "in_review" };
}

export function computeDocumentStatus(
  category: DocumentCategory,
  revisions: { revNo: number; status: RevisionStatus }[],
  reviewDueAt: Date | null,
  now: Date = new Date(),
): DocumentStatusResult {
  if (category === "external") {
    return { primary: { kind: "external", ...externalStatus(reviewDueAt, now) } };
  }
  if (revisions.length === 0) {
    return { primary: { kind: "approval", status: "draft" } };
  }
  const approved = revisions.find((r) => r.status === "approved");
  const latest = revisions.reduce((a, b) => (b.revNo > a.revNo ? b : a));
  if (approved) {
    const inFlight =
      latest.revNo > approved.revNo && (latest.status === "draft" || latest.status === "in_review")
        ? { revNo: latest.revNo, status: latest.status as "draft" | "in_review" }
        : undefined;
    return { primary: { kind: "approval", status: "approved" }, inFlight };
  }
  return { primary: { kind: "approval", status: latest.status } };
}
