import { tenantIsolationSuite } from "../test/tenantIsolationSuite";
import { SEED_MISSION, SEED_PERSON, seedMission, seedPersons } from "../test/isolationSeeds";

// M4 operations family — locations, crew, documents and notes hang off a
// seeded mission.

tenantIsolationSuite({
  table: "missions",
  // random code keeps (org_id, code) unique across inserts
  extraColumns: {
    code: "md5(random()::text)",
    title: "'Isolation test mission'",
    jurisdiction: "'UAE-Federal'",
    operational_category: "'open'",
  },
});

tenantIsolationSuite({
  table: "mission_locations",
  seedSql: seedMission,
  extraColumns: { mission_id: `'${SEED_MISSION}'` },
});

tenantIsolationSuite({
  table: "mission_crew",
  seedSql: `${seedMission} ${seedPersons}`,
  // $N picks a distinct seeded person per insert so
  // (org_id, mission_id, person_id, role) stays unique
  extraColumns: {
    mission_id: `'${SEED_MISSION}'`,
    person_id: `'${SEED_PERSON("$N")}'`,
    role: "'pilot'",
  },
});

tenantIsolationSuite({
  table: "mission_documents",
  seedSql: seedMission,
  extraColumns: {
    mission_id: `'${SEED_MISSION}'`,
    file_id: "gen_random_uuid()",
    flow: "'inbound'",
    kind: "'other'",
  },
});

tenantIsolationSuite({
  table: "mission_notes",
  seedSql: seedMission,
  extraColumns: { mission_id: `'${SEED_MISSION}'`, body: "'Isolation test note'" },
});
