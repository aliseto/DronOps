import { tenantIsolationSuite } from "../test/tenantIsolationSuite";

// memberships is org-scoped; email is NOT NULL and unique per org, so each
// seed row gets a random one.
tenantIsolationSuite({
  table: "memberships",
  extraColumns: { email: "md5(random()::text)" },
});
