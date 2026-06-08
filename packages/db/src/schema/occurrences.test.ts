import { tenantIsolationSuite } from "../test/tenantIsolationSuite";

// occurrences is org-scoped; code/classification/title/jurisdiction/occurred_at
// are NOT NULL with no default, so the suite must supply them for its seeds.
tenantIsolationSuite({
  table: "occurrences",
  extraColumns: {
    code: "'OCC-001'",
    classification: "'incident'",
    title: "'Test occurrence'",
    jurisdiction: "'UAE-Federal'",
    occurred_at: "now()",
  },
});
