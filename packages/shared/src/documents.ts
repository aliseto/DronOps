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
