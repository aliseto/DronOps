import { tenantIsolationSuite } from "../test/tenantIsolationSuite";

// org_jurisdictions is org-scoped; jurisdiction_key is NOT NULL and unique per
// org, so each seed row gets a random one.
tenantIsolationSuite({
  table: "org_jurisdictions",
  extraColumns: { jurisdiction_key: "md5(random()::text)" },
});
