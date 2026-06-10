import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";

/**
 * Reusable both-directions tenant-isolation suite (CLAUDE.md rule 2 — a release
 * criterion for every org-scoped table). Proves, against a real Postgres, that
 * the restricted app_user role:
 *   - sees only its own org's rows (SELECT isolation)
 *   - can insert into its own org
 *   - cannot insert into another org (withCheck)
 *   - cannot hard-delete (no DELETE grant / policy)
 *
 * Requires DATABASE_URL pointing at a role able to `SET ROLE app_user`
 * (e.g. the direct postgres connection). Skipped when unset so CI stays green
 * without secrets; run locally with env to execute.
 */
export interface IsolationCase {
  /** Table under test. */
  table: string;
  /** Extra NOT NULL columns (besides org_id) and SQL literal values for inserts.
   * Values may contain `$N`, replaced with the insert ordinal (0–3) so unique
   * constraints can be satisfied across the suite's inserts. */
  extraColumns?: Record<string, string>;
  /** Admin-run idempotent SQL executed before the scenario — FK parent rows.
   * FK validation bypasses RLS (parents may live in either org), which is
   * exactly why the child table's own policies must hold. */
  seedSql?: string;
  /** For one-row-per-org tables (unique on org_id alone): a second own-org
   * INSERT would collide, so the write half tests UPDATE isolation instead
   * (own row updatable, other org's row invisible to UPDATE). */
  singletonPerOrg?: boolean;
}

const ORG_A = "00000000-0000-0000-0000-0000000000aa";
const ORG_B = "00000000-0000-0000-0000-0000000000bb";

export function tenantIsolationSuite({
  table,
  extraColumns = {},
  seedSql,
  singletonPerOrg = false,
}: IsolationCase) {
  const url = process.env.DATABASE_URL;
  const cols = Object.keys(extraColumns);
  const colList = ["org_id", ...cols].map((c) => `"${c}"`).join(", ");
  const valList = (org: string, n: number) =>
    [`'${org}'::uuid`, ...cols.map((c) => extraColumns[c]!.replaceAll("$N", String(n)))].join(", ");

  const writeScenario = singletonPerOrg
    ? `
          UPDATE ${table} SET updated_at = now();
          GET DIAGNOSTICS affected = ROW_COUNT;
          IF affected <> 1 THEN RAISE EXCEPTION 'own-org update touched % rows', affected; END IF;

          UPDATE ${table} SET updated_at = now() WHERE org_id = '${ORG_B}';
          GET DIAGNOSTICS affected = ROW_COUNT;
          IF affected <> 0 THEN RAISE EXCEPTION 'cross-tenant update touched % rows', affected; END IF;`
    : `
          INSERT INTO ${table}(${colList}) VALUES (${valList(ORG_A, 2)});

          blocked := false;
          BEGIN INSERT INTO ${table}(${colList}) VALUES (${valList(ORG_B, 3)});
          EXCEPTION WHEN others THEN blocked := true; END;
          IF NOT blocked THEN RAISE EXCEPTION 'cross-tenant insert not blocked'; END IF;`;

  describe.skipIf(!url)(`tenant isolation: ${table}`, () => {
    let sql: postgres.Sql;
    beforeAll(() => {
      sql = postgres(url as string, { max: 1, prepare: false });
    });
    afterAll(async () => {
      await sql?.end();
    });

    it("isolates select + writes and forbids delete for app_user", async () => {
      if (seedSql) await sql.unsafe(seedSql);
      // The whole scenario runs in one DO block so the role/GUC context holds.
      const rows = await sql.unsafe<Array<{ ok: boolean }>>(`
        DO $$
        DECLARE visible int; blocked boolean; affected int;
        BEGIN
          INSERT INTO ${table}(${colList}) VALUES (${valList(ORG_A, 0)});
          INSERT INTO ${table}(${colList}) VALUES (${valList(ORG_B, 1)});

          SET LOCAL ROLE app_user;
          PERFORM set_config('app.current_org_id', '${ORG_A}', true);

          SELECT count(*) INTO visible FROM ${table};
          IF visible <> 1 THEN RAISE EXCEPTION 'select-isolation saw %', visible; END IF;
${writeScenario}

          blocked := false;
          BEGIN DELETE FROM ${table};
          EXCEPTION WHEN others THEN blocked := true; END;
          IF NOT blocked THEN RAISE EXCEPTION 'delete not blocked'; END IF;

          RESET ROLE;
        END $$;
        SELECT true AS ok;
      `);
      expect(rows[0]?.ok).toBe(true);

      // Cleanup (TRUNCATE bypasses row-level append-only triggers).
      await sql.unsafe(`TRUNCATE ${table} CASCADE`);
    });
  });
}
