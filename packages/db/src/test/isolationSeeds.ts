/**
 * Fixed-UUID FK parents for the isolation suites. All live in a NEUTRAL third
 * org (never the suite's A/B orgs) so a seeded parent in the table under test
 * can't pollute the select-isolation count. FK validation bypasses RLS, so a
 * child row in either org may reference them; the child table's own policies
 * are what the suites prove. Every snippet is idempotent (ON CONFLICT DO
 * NOTHING) because suites re-seed after earlier suites' TRUNCATE … CASCADE
 * cleanup.
 */
const ORG_SEED = "00000000-0000-0000-0000-0000000000cc";

export const SEED_PERSON = (n: string) => `00000000-0000-0000-aaaa-00000000000${n}`;
export const SEED_DOC = "00000000-0000-0000-d0c0-000000000001";
export const SEED_REV = "00000000-0000-0000-d0c0-000000000002";
export const SEED_DIST = "00000000-0000-0000-d0c0-000000000003";
export const SEED_AIRCRAFT = "00000000-0000-0000-a1c0-000000000001";
export const SEED_MISSION = "00000000-0000-0000-b1b1-000000000001";
export const SEED_FINDING = "00000000-0000-0000-f1d0-000000000001";
export const SEED_TEMPLATE = "00000000-0000-0000-f0a0-000000000001";

export const seedPersons = `
  INSERT INTO persons (id, org_id, name) VALUES
    ('${SEED_PERSON("0")}', '${ORG_SEED}', 'Iso seed 0'),
    ('${SEED_PERSON("1")}', '${ORG_SEED}', 'Iso seed 1'),
    ('${SEED_PERSON("2")}', '${ORG_SEED}', 'Iso seed 2'),
    ('${SEED_PERSON("3")}', '${ORG_SEED}', 'Iso seed 3')
  ON CONFLICT DO NOTHING;
`;

export const seedDocument = `
  INSERT INTO documents (id, org_id, category, doc_no, title)
  VALUES ('${SEED_DOC}', '${ORG_SEED}', 'manual', 'ISO-SEED-001', 'Isolation seed')
  ON CONFLICT DO NOTHING;
`;

export const seedRevision = `
  ${seedDocument}
  INSERT INTO document_revisions (id, org_id, document_id, rev_no)
  VALUES ('${SEED_REV}', '${ORG_SEED}', '${SEED_DOC}', 999)
  ON CONFLICT DO NOTHING;
`;

export const seedDistribution = `
  ${seedRevision}
  INSERT INTO document_distributions (id, org_id, revision_id, audience_type, audience_ref)
  VALUES ('${SEED_DIST}', '${ORG_SEED}', '${SEED_REV}', 'role', 'pilot')
  ON CONFLICT DO NOTHING;
`;

export const seedAircraft = `
  INSERT INTO aircraft (id, org_id, label, airframe_class)
  VALUES ('${SEED_AIRCRAFT}', '${ORG_SEED}', 'Iso seed aircraft', 'multirotor')
  ON CONFLICT DO NOTHING;
`;

export const seedMission = `
  INSERT INTO missions (id, org_id, code, title, jurisdiction, operational_category)
  VALUES ('${SEED_MISSION}', '${ORG_SEED}', 'ISO-SEED-MIS', 'Isolation seed', 'UAE-Federal', 'open')
  ON CONFLICT DO NOTHING;
`;

export const seedFinding = `
  INSERT INTO findings (id, org_id, code, source, level, title)
  VALUES ('${SEED_FINDING}', '${ORG_SEED}', 'ISO-SEED-NCR', 'manual', 'minor', 'Isolation seed')
  ON CONFLICT DO NOTHING;
`;

export const seedFormTemplate = `
  INSERT INTO form_templates (id, org_id, code, version, title, schema)
  VALUES ('${SEED_TEMPLATE}', '${ORG_SEED}', 'ISO-SEED-FRM', 999, 'Isolation seed', '{}'::jsonb)
  ON CONFLICT DO NOTHING;
`;
