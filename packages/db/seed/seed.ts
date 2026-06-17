/**
 * Dev / CI seed. Regulators are seeded by migration 0001; this adds an optional
 * demo tenant + org + owner for local exploration and e2e (SEED_DEMO=1). Uses a
 * privileged connection (ADMIN_DATABASE_URL) that may insert auth.users.
 */
import "dotenv/config";
import postgres from "postgres";

async function main() {
  if (process.env.SEED_DEMO !== "1") {
    console.log("seed: nothing to do (set SEED_DEMO=1 for a demo tenant)");
    return;
  }
  const url = process.env.ADMIN_DATABASE_URL ?? process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("ADMIN_DATABASE_URL (or DIRECT/DATABASE_URL) is required");
  const sql = postgres(url, { prepare: false, max: 1 });
  try {
    const email = process.env.SEED_EMAIL ?? "demo@dom.local";
    const [user] = await sql<{ id: string }[]>`
      insert into auth.users (email) values (${email})
      on conflict do nothing
      returning id`;
    const userId =
      user?.id ?? (await sql<{ id: string }[]>`select id from auth.users where email = ${email}`)[0]!.id;

    await sql`select set_config('request.jwt.claims', ${JSON.stringify({ sub: userId, email })}, true)`;
    await sql`set local role authenticated`;
    const [t] = await sql<{ id: string }[]>`select app.create_tenant(${"Demo operator"}) as id`;
    const [reg] = await sql<{ id: string }[]>`select id from public.regulators where code = 'GCAA'`;
    await sql`insert into public.organisations (tenant_id, name, primary_regulator_id, jurisdiction)
              values (${t!.id}, ${"Demo org"}, ${reg!.id}, 'UAE')`;
    console.log(`seed: demo tenant ${t!.id} for ${email}`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
