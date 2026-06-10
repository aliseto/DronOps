import { tenantIsolationSuite } from "../test/tenantIsolationSuite";
import { SEED_DOC, seedDocument } from "../test/isolationSeeds";

// M1 documents family. One file: the suites share the seeded parent document
// and cleanup TRUNCATE … CASCADE crosses tables, so order is deliberate —
// the parent-less tables first, then children that re-seed the document.

tenantIsolationSuite({
  table: "counters",
  extraColumns: { key: "md5(random()::text)" },
});

tenantIsolationSuite({
  table: "documents",
  extraColumns: {
    category: "'manual'",
    doc_no: "md5(random()::text)",
    title: "'Isolation test doc'",
  },
});

tenantIsolationSuite({
  table: "document_requirements",
  seedSql: seedDocument,
  extraColumns: {
    document_id: `'${SEED_DOC}'`,
    requirement_ref: "md5(random()::text)",
  },
});

tenantIsolationSuite({
  table: "document_revisions",
  seedSql: seedDocument,
  // $N keeps (org_id, document_id, rev_no) unique across the suite's inserts.
  extraColumns: { document_id: `'${SEED_DOC}'`, rev_no: "$N" },
});
