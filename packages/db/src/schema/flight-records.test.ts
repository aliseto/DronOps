import { tenantIsolationSuite } from "../test/tenantIsolationSuite";
import { SEED_AIRCRAFT, seedAircraft } from "../test/isolationSeeds";

// M6 flight evidence — records hang off a seeded aircraft; status defaults to
// draft so the sealed-immutability trigger does not block the seed inserts.
tenantIsolationSuite({
  table: "flight_records",
  seedSql: seedAircraft,
  extraColumns: { aircraft_id: `'${SEED_AIRCRAFT}'`, flown_at: "now()" },
});
