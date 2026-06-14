import { tenantIsolationSuite } from "../test/tenantIsolationSuite";

// management_reviews is org-scoped; status defaults to draft so the
// signed-immutability trigger does not block the seed inserts.
tenantIsolationSuite({
  table: "management_reviews",
  extraColumns: {
    code: "md5(random()::text)",
    period_start: "now()",
    period_end: "now()",
  },
});
