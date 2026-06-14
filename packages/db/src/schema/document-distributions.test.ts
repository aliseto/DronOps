import { tenantIsolationSuite } from "../test/tenantIsolationSuite";
import {
  SEED_DIST,
  SEED_PERSON,
  SEED_REV,
  seedDistribution,
  seedPersons,
  seedRevision,
} from "../test/isolationSeeds";

// D-03 distribution + acks (PR-013).

tenantIsolationSuite({
  table: "document_distributions",
  seedSql: seedRevision,
  extraColumns: {
    revision_id: `'${SEED_REV}'`,
    audience_type: "'role'",
    audience_ref: "md5(random()::text)",
  },
});

tenantIsolationSuite({
  table: "document_acks",
  seedSql: `${seedDistribution} ${seedPersons}`,
  // $N picks a distinct seeded person per insert so
  // (org_id, distribution_id, person_id) stays unique.
  extraColumns: {
    distribution_id: `'${SEED_DIST}'`,
    person_id: `'${SEED_PERSON("$N")}'`,
  },
});
