import { tenantIsolationSuite } from "../test/tenantIsolationSuite";

// hazards is org-scoped; code + title are NOT NULL with no default.
tenantIsolationSuite({
  table: "hazards",
  extraColumns: {
    code: "'HAZ-001'",
    title: "'Test hazard'",
  },
});
