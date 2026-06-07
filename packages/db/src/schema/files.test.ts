import { tenantIsolationSuite } from "../test/tenantIsolationSuite";

// files is org-scoped + append-only. Distinct sha256 per seed row to respect the
// unique (org_id, sha256) index — but the suite reuses values, so this only runs
// as a smoke of select/insert/delete isolation (unique collisions are tolerated
// by the suite's cross-tenant inserts using a different org).
tenantIsolationSuite({
  table: "files",
  extraColumns: {
    sha256: "md5(random()::text)",
    mime: "'application/pdf'",
    size: "1",
    storage_key: "md5(random()::text)",
  },
});
