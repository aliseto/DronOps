import { tenantIsolationSuite } from "../test/tenantIsolationSuite";
import { SEED_TEMPLATE, seedFormTemplate } from "../test/isolationSeeds";

// M1 form templates — instances pin a seeded template version (hard rule 6).

tenantIsolationSuite({
  table: "form_templates",
  // random code keeps (org_id, code, version) unique across inserts
  extraColumns: {
    code: "md5(random()::text)",
    version: "1",
    title: "'Isolation test template'",
    schema: "'{}'::jsonb",
  },
});

tenantIsolationSuite({
  table: "form_instances",
  seedSql: seedFormTemplate,
  extraColumns: {
    template_id: `'${SEED_TEMPLATE}'`,
    template_code: "'ISO-SEED-FRM'",
    template_version: "999",
    data: "'{}'::jsonb",
  },
});
