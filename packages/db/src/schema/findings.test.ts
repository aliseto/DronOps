import { tenantIsolationSuite } from "../test/tenantIsolationSuite";
import { SEED_FINDING, seedFinding } from "../test/isolationSeeds";

// M2 deviation→finding loop — CAPA actions hang off a seeded finding.

tenantIsolationSuite({
  table: "findings",
  extraColumns: {
    code: "md5(random()::text)",
    source: "'manual'",
    level: "'minor'",
    title: "'Isolation test finding'",
  },
});

tenantIsolationSuite({
  table: "capa_actions",
  seedSql: seedFinding,
  extraColumns: {
    finding_id: `'${SEED_FINDING}'`,
    kind: "'corrective'",
    description: "'Isolation test action'",
  },
});
