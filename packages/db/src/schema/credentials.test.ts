import { tenantIsolationSuite } from "../test/tenantIsolationSuite";
import { SEED_PERSON, seedPersons } from "../test/isolationSeeds";

// M7 personnel family — all hang off seeded persons. org_currency_rules is a
// one-row-per-org singleton, so its write half tests UPDATE isolation.

tenantIsolationSuite({
  table: "credentials",
  seedSql: seedPersons,
  extraColumns: { person_id: `'${SEED_PERSON("0")}'`, kind: "'rpc'" },
});

tenantIsolationSuite({
  table: "recency_events",
  seedSql: seedPersons,
  // source defaults to 'manual', so the m6 dedup unique index does not apply
  extraColumns: {
    person_id: `'${SEED_PERSON("0")}'`,
    event_type: "'flight'",
    occurred_at: "now()",
  },
});

tenantIsolationSuite({
  table: "duty_records",
  seedSql: seedPersons,
  extraColumns: {
    person_id: `'${SEED_PERSON("0")}'`,
    start_at: "now()",
    end_at: "now()",
  },
});

tenantIsolationSuite({
  table: "org_currency_rules",
  singletonPerOrg: true,
});
