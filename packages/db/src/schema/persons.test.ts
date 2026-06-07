import { tenantIsolationSuite } from "../test/tenantIsolationSuite";

// persons is org-scoped; identity_no is nullable so the suite's repeated seed
// rows don't collide on the unique index.
tenantIsolationSuite({
  table: "persons",
  extraColumns: { name: "'Test Person'" },
});
