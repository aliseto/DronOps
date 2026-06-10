import { tenantIsolationSuite } from "../test/tenantIsolationSuite";

// sora_assessments is org-scoped; code/title/scenario/dimension/initial_arc are
// NOT NULL with no default (mission_id is nullable, so no FK seed needed).
tenantIsolationSuite({
  table: "sora_assessments",
  extraColumns: {
    code: "'SORA-001'",
    title: "'Test SORA'",
    scenario: "'bvlos_sparse'",
    dimension: "'3m'",
    initial_arc: "'b'",
  },
});
