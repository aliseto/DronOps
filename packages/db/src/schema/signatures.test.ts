import { tenantIsolationSuite } from "../test/tenantIsolationSuite";

// signatures is org-scoped and append-only; meaning/entity_type/payload_hash/
// method are NOT NULL with no default.
tenantIsolationSuite({
  table: "signatures",
  extraColumns: {
    meaning: "'Isolation test signature'",
    entity_type: "'test'",
    payload_hash: "md5(random()::text)",
    method: "'password'",
  },
});
