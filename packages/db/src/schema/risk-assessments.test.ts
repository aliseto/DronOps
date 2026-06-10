import { tenantIsolationSuite } from "../test/tenantIsolationSuite";
import { SEED_MISSION, seedMission } from "../test/isolationSeeds";

// M3 risk assessments hang off a seeded mission; status defaults to draft so
// the approved-immutability trigger does not block the seed inserts.
tenantIsolationSuite({
  table: "risk_assessments",
  seedSql: seedMission,
  extraColumns: {
    code: "md5(random()::text)",
    mission_id: `'${SEED_MISSION}'`,
    profile: "'vlos'",
    title: "'Isolation test assessment'",
  },
});
