import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

// Standalone migration runner for deploys/local. Uses the DIRECT connection.
async function main() {
  const url = process.env.DIRECT_DATABASE_URL;
  if (!url) throw new Error("DIRECT_DATABASE_URL is required to run migrations");
  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: "./drizzle" });
  await sql.end();
  console.log("migrations applied");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
