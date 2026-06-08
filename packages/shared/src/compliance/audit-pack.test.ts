import { describe, it, expect } from "vitest";
import { summarizeAuditPack, type AuditPackArgs } from "./audit-pack";

const base: AuditPackArgs = {
  frameworks: ["GCAA-UAE", "ISO-9001"],
  periodStart: "2026-01-01",
  periodEnd: "2026-06-30",
  sealedAt: "2026-06-08T10:00:00.000Z",
  findings: [
    { id: "f1", code: "NCR-001", title: "Logbook gap", level: "major", status: "open", jurisdiction: "GCAA-UAE", source: "audit", dueAt: "2026-07-01", evidenceSha256: "aaa" },
    { id: "f2", code: "NCR-002", title: "Battery swell", level: "minor", status: "closed", jurisdiction: "GCAA-UAE", source: "flight_deviation", dueAt: null, evidenceSha256: null },
  ],
  documents: [
    { id: "d1", docNo: "DOC-012", title: "Operations Manual", category: "manual", status: "approved", revNo: 3, bodySha256: "bbb" },
    { id: "d2", docNo: "DOC-020", title: "SMS Policy", category: "policy", status: "draft", revNo: null, bodySha256: null },
  ],
  reviews: [
    { id: "r1", code: "MR-001", title: "Q1 review", periodStart: "2026-01-01", periodEnd: "2026-03-31", status: "signed", signedAt: "2026-04-02", signatureHash: "ccc" },
  ],
  coverage: [
    { framework: "GCAA-UAE", total: 40, covered: 30, partial: 4, gap: 6, pct: 80 },
    { framework: "ISO-9001", total: 20, covered: 10, partial: 0, gap: 10, pct: 50 },
  ],
};

describe("audit-pack assembler", () => {
  const s = summarizeAuditPack(base);

  it("freezes scope and counts the free selection", () => {
    expect(s.scope.frameworks).toEqual(["GCAA-UAE", "ISO-9001"]);
    expect(s.counts).toMatchObject({ frameworks: 2, findings: 2, openFindings: 1, documents: 2, reviews: 1 });
  });

  it("rolls up coverage across the scoped frameworks", () => {
    expect(s.coverage.totals.total).toBe(60);
    expect(s.coverage.totals.covered).toBe(40);
    // (40 + 4*0.5) / 60 = 70%
    expect(s.coverage.totals.pct).toBe(70);
  });

  it("builds an evidence index with one entry per included artifact", () => {
    expect(s.evidenceIndex).toHaveLength(5); // 2 documents + 2 findings + 1 review
  });

  it("anchors documents to their controlling-revision hash", () => {
    const doc = s.evidenceIndex.find((e) => e.ref === "DOC-012 r3");
    expect(doc).toMatchObject({ kind: "document", hash: "bbb" });
  });

  it("anchors reviews to the signature payload hash", () => {
    const rev = s.evidenceIndex.find((e) => e.ref === "MR-001");
    expect(rev).toMatchObject({ kind: "review", hash: "ccc" });
  });

  it("counts only verifiable (hash-bearing) evidence entries", () => {
    // DOC-012(bbb) + NCR-001(aaa) + MR-001(ccc) = 3; DOC-020 and NCR-002 have no hash
    expect(s.counts.evidence).toBe(3);
  });

  it("drops internal ids from the frozen snapshot", () => {
    expect(s.findings[0]).not.toHaveProperty("id");
    expect(s.documents[0]).not.toHaveProperty("id");
  });
});
