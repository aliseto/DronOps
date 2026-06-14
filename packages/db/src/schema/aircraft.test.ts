import { tenantIsolationSuite } from "../test/tenantIsolationSuite";
import { SEED_AIRCRAFT, seedAircraft } from "../test/isolationSeeds";

// M5 fleet family — components and the maintenance logbook hang off a seeded
// aircraft.

tenantIsolationSuite({
  table: "aircraft",
  // identifier is nullable (unique index treats NULLs as distinct)
  extraColumns: { label: "'Isolation test aircraft'", airframe_class: "'multirotor'" },
});

tenantIsolationSuite({
  table: "aircraft_components",
  seedSql: seedAircraft,
  extraColumns: {
    aircraft_id: `'${SEED_AIRCRAFT}'`,
    kind: "'battery'",
    label: "'Isolation test component'",
  },
});

tenantIsolationSuite({
  table: "maintenance_records",
  seedSql: seedAircraft,
  extraColumns: {
    aircraft_id: `'${SEED_AIRCRAFT}'`,
    type: "'inspection'",
    performed_at: "now()",
    description: "'Isolation test record'",
  },
});
