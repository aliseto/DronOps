/**
 * Audit-pack assembler — pure aggregation over data already resolved by the
 * server (selected M2 findings, M1 documents, M2 management reviews, and the
 * coverage matrix scoped to the chosen frameworks). It builds NO new analytics
 * and reads NO commercial data; it freezes the curated free-selection into the
 * snapshot stored on the sealed, immutable pack.
 *
 * Every included artifact contributes an entry to the EVIDENCE INDEX with its
 * integrity anchor: a document's controlling-revision file SHA-256, a finding's
 * content-addressed evidence file SHA-256, or a review's signature payload hash.
 * The pack's own signature hashes this whole snapshot, so the index is what a
 * regulator verifies the bundle against.
 */

const TERMINAL_FINDING = new Set(["closed", "false-positive"]);

export interface PackFindingInput {
  id: string;
  code: string;
  title: string;
  level: string;
  status: string;
  jurisdiction: string | null;
  source: string;
  dueAt: string | null;
  /** SHA-256 of the content-addressed evidence file, when one is attached. */
  evidenceSha256: string | null;
}
export interface PackDocumentInput {
  id: string;
  docNo: string;
  title: string;
  category: string;
  status: string;
  /** Controlling (current/approved) revision number, when one exists. */
  revNo: number | null;
  /** SHA-256 of that revision's body file, when stored. */
  bodySha256: string | null;
}
export interface PackReviewInput {
  id: string;
  code: string;
  title: string | null;
  periodStart: string;
  periodEnd: string;
  status: string;
  signedAt: string | null;
  /** Signature payload hash (anchors the review's integrity). */
  signatureHash: string | null;
}
export interface PackCoverageFramework {
  framework: string;
  total: number;
  covered: number;
  partial: number;
  gap: number;
  pct: number | null;
}

export interface AuditPackArgs {
  frameworks: readonly string[];
  periodStart: string;
  periodEnd: string;
  sealedAt: string;
  findings: readonly PackFindingInput[];
  documents: readonly PackDocumentInput[];
  reviews: readonly PackReviewInput[];
  /** Coverage already filtered to the pack's frameworks. */
  coverage: readonly PackCoverageFramework[];
}

export interface EvidenceIndexEntry {
  ref: string; // AP-relative artifact ref, e.g. "DOC-012 r3"
  kind: "document" | "finding" | "review";
  label: string;
  /** SHA-256 (documents/findings) or signature payload hash (reviews); null when none. */
  hash: string | null;
}

export interface AuditPackSnapshot {
  scope: {
    frameworks: string[];
    periodStart: string;
    periodEnd: string;
    sealedAt: string;
  };
  coverage: {
    byFramework: PackCoverageFramework[];
    totals: { total: number; covered: number; partial: number; gap: number; pct: number | null };
  };
  findings: Array<Omit<PackFindingInput, "id">>;
  documents: Array<Omit<PackDocumentInput, "id">>;
  reviews: Array<Omit<PackReviewInput, "id">>;
  evidenceIndex: EvidenceIndexEntry[];
  counts: {
    frameworks: number;
    findings: number;
    openFindings: number;
    documents: number;
    reviews: number;
    evidence: number; // entries carrying a verifiable hash
  };
}

const pct = (covered: number, partial: number, total: number): number | null =>
  total === 0 ? null : Math.round(((covered + partial * 0.5) / total) * 100);

/** Freeze the curated free-selection into the pack snapshot + evidence index. Pure. */
export function summarizeAuditPack(a: AuditPackArgs): AuditPackSnapshot {
  const byFramework = a.coverage.map((c) => ({ ...c }));
  const totals = byFramework.reduce(
    (acc, c) => {
      acc.total += c.total;
      acc.covered += c.covered;
      acc.partial += c.partial;
      acc.gap += c.gap;
      return acc;
    },
    { total: 0, covered: 0, partial: 0, gap: 0 },
  );

  const evidenceIndex: EvidenceIndexEntry[] = [];
  for (const d of a.documents) {
    evidenceIndex.push({
      ref: d.revNo != null ? `${d.docNo} r${d.revNo}` : d.docNo,
      kind: "document",
      label: d.title,
      hash: d.bodySha256,
    });
  }
  for (const f of a.findings) {
    evidenceIndex.push({ ref: f.code, kind: "finding", label: f.title, hash: f.evidenceSha256 });
  }
  for (const r of a.reviews) {
    evidenceIndex.push({ ref: r.code, kind: "review", label: r.title ?? r.code, hash: r.signatureHash });
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const findings = a.findings.map(({ id, ...rest }) => rest);
  const documents = a.documents.map(({ id, ...rest }) => rest);
  const reviews = a.reviews.map(({ id, ...rest }) => rest);
  /* eslint-enable @typescript-eslint/no-unused-vars */

  return {
    scope: {
      frameworks: [...a.frameworks],
      periodStart: a.periodStart,
      periodEnd: a.periodEnd,
      sealedAt: a.sealedAt,
    },
    coverage: { byFramework, totals: { ...totals, pct: pct(totals.covered, totals.partial, totals.total) } },
    findings,
    documents,
    reviews,
    evidenceIndex,
    counts: {
      frameworks: a.frameworks.length,
      findings: a.findings.length,
      openFindings: a.findings.filter((f) => !TERMINAL_FINDING.has(f.status)).length,
      documents: a.documents.length,
      reviews: a.reviews.length,
      evidence: evidenceIndex.filter((e) => e.hash != null).length,
    },
  };
}
