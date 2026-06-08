import { tenantIsolationSuite } from "../test/tenantIsolationSuite";

// audit_packs is org-scoped; code + the period bounds are NOT NULL with no
// default, so the suite must supply them for its repeated seed inserts.
tenantIsolationSuite({
  table: "audit_packs",
  extraColumns: {
    code: "'AP-001'",
    period_start: "now()",
    period_end: "now()",
  },
});
