import { tenantIsolationSuite } from "../test/tenantIsolationSuite";

// org_template_params is a one-row-per-org singleton (unique on org_id), so
// the write half tests UPDATE isolation instead of a second own-org insert.
tenantIsolationSuite({
  table: "org_template_params",
  singletonPerOrg: true,
  extraColumns: { params: "'{}'::jsonb" },
});
