import { tenantIsolationSuite } from "../test/tenantIsolationSuite";
import { SEED_PERSON, seedPersons } from "../test/isolationSeeds";

// person_roles + user_persons hang off seeded persons (FK validation bypasses
// RLS — which is why these tables' own policies must hold).

tenantIsolationSuite({
  table: "person_roles",
  seedSql: seedPersons,
  // random role keeps (org_id, person_id, role) unique across inserts
  extraColumns: { person_id: `'${SEED_PERSON("0")}'`, role: "md5(random()::text)" },
});

tenantIsolationSuite({
  table: "user_persons",
  seedSql: seedPersons,
  // $N picks a distinct seeded person per insert — (org_id, person_id) is unique
  extraColumns: { user_id: "md5(random()::text)", person_id: `'${SEED_PERSON("$N")}'` },
});
