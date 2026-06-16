/**
 * Two-tier RLS isolation proof (Phase 0 exit criterion). Runs only when
 * DATABASE_URL points at a migrated database (CI provisions one); skips locally
 * otherwise. Seeds two tenants via the create_tenant bootstrap RPC, then asserts
 * a user in tenant A cannot see tenant B's data, and the last-admin guard fires.
 */
import { afterAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { createSql, withRlsSession } from "./client";
import { organisations } from "./schema/index";

const URL = process.env.DATABASE_URL;
const run = URL ? describe : describe.skip;

run("two-tier RLS isolation", () => {
  const admin = postgres(URL!, { prepare: false, max: 1 });
  const conn = createSql(URL!);
  const tag = Math.random().toString(36).slice(2, 8);

  afterAll(async () => {
    await admin.end();
    await conn.end();
  });

  async function makeUser(email: string): Promise<string> {
    const [row] = await admin<{ id: string }[]>`
      insert into auth.users (email) values (${email}) returning id`;
    return row!.id;
  }

  async function regulatorId(code: string): Promise<string> {
    const [row] = await admin<{ id: string }[]>`select id from public.regulators where code = ${code}`;
    return row!.id;
  }

  it("a user only sees their own tenant's organisations", async () => {
    const userA = await makeUser(`a-${tag}@example.com`);
    const userB = await makeUser(`b-${tag}@example.com`);
    const reg = await regulatorId("GCAA");

    // Each user bootstraps their own tenant and creates one org (as its admin).
    const tenantA = await withRlsSession(conn, { sub: userA, email: `a-${tag}@example.com` }, async (db) => {
      const [r] = await db.execute<{ id: string }>(sql`select app.create_tenant(${`Tenant A ${tag}`}) as id`);
      const tid = (r as { id: string }).id;
      await db.insert(organisations).values({ tenantId: tid, name: `Org A ${tag}`, primaryRegulatorId: reg });
      return tid;
    });

    await withRlsSession(conn, { sub: userB, email: `b-${tag}@example.com` }, async (db) => {
      const [r] = await db.execute<{ id: string }>(sql`select app.create_tenant(${`Tenant B ${tag}`}) as id`);
      const tid = (r as { id: string }).id;
      await db.insert(organisations).values({ tenantId: tid, name: `Org B ${tag}`, primaryRegulatorId: reg });
    });

    // User A sees exactly their org, never tenant B's.
    const seenByA = await withRlsSession(conn, { sub: userA, email: `a-${tag}@example.com` }, (db) =>
      db.select().from(organisations),
    );
    expect(seenByA.length).toBe(1);
    expect(seenByA[0]!.name).toBe(`Org A ${tag}`);

    // And A's tenant is the one it created.
    expect(tenantA).toBeTruthy();
  });

  it("the last-admin guard prevents locking out a tenant", async () => {
    const user = await makeUser(`solo-${tag}@example.com`);
    const tenant = await withRlsSession(conn, { sub: user, email: `solo-${tag}@example.com` }, async (db) => {
      const [r] = await db.execute<{ id: string }>(sql`select app.create_tenant(${`Solo ${tag}`}) as id`);
      return (r as { id: string }).id;
    });

    await expect(
      withRlsSession(conn, { sub: user, email: `solo-${tag}@example.com` }, (db) =>
        db.execute(sql`delete from public.user_tenant_roles where tenant_id = ${tenant}`),
      ),
    ).rejects.toThrow(/last administrator/i);
  });
});
