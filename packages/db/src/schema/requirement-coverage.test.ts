import { tenantIsolationSuite } from "../test/tenantIsolationSuite";

// requirement_coverage is org-scoped; requirement_ref is unique per org, so
// each seed row gets a random one.
tenantIsolationSuite({
  table: "requirement_coverage",
  extraColumns: { requirement_ref: "md5(random()::text)" },
});
