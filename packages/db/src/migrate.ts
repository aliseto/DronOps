/**
 * Ordered raw-SQL migration runner. Applies migrations/*.sql in filename order
 * against DIRECT_DATABASE_URL. Statements run via simple-query (autocommit per
 * statement) so `alter type … add value` is usable in the same file.
 *
 * On Supabase the `auth` schema already exists. For plain Postgres (CI / local
 * pgTAP) set APPLY_AUTH_SHIM=1 to install a minimal auth shim first.
 */
import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "..", "migrations");
const sqlDir = join(here, "..", "sql");

async function main() {
  const url = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_DATABASE_URL (or DATABASE_URL) is required");

  const sql = postgres(url, { prepare: false, max: 1 });
  try {
    if (process.env.APPLY_AUTH_SHIM === "1") {
      console.log("• applying auth shim (CI/local plain Postgres)");
      await sql.unsafe(await readFile(join(sqlDir, "00_auth_shim.sql"), "utf8"));
    }
    const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      console.log("• applying", file);
      await sql.unsafe(await readFile(join(migrationsDir, file), "utf8"));
    }
    console.log("✓ migrations complete");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
