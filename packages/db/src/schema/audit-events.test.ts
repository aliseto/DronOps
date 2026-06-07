import { tenantIsolationSuite } from "../test/tenantIsolationSuite";

// audit_events is org-scoped and append-only. Isolation is asserted here; the
// append-only trigger is covered by the spine verification (see PR-004 notes).
tenantIsolationSuite({
  table: "audit_events",
  extraColumns: { action: "'test'", entity_type: "'t'" },
});
