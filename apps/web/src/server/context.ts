import { redirect } from "next/navigation";
import { schema } from "@dom/db";
import type { RlsClaims } from "@dom/db";
import { getSessionUser } from "@/lib/session";
import { withRls } from "@/lib/db";

export interface ActiveContext {
  userId: string;
  email: string;
  orgId: string;
  tenantId: string;
}

/**
 * Resolve the signed-in user's active organisation (the first one RLS returns)
 * and its tenant. Redirects to sign-in / onboarding when there is no session or
 * no organisation yet. A proper org switcher is a later enhancement.
 */
export async function getActiveContext(): Promise<ActiveContext> {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const orgs = await withRls({ sub: user.id, email: user.email }, (db) =>
    db.select().from(schema.organisations),
  );
  if (orgs.length === 0) redirect("/onboarding");
  const org = orgs[0]!;
  return { userId: user.id, email: user.email, orgId: org.id, tenantId: org.tenantId };
}

export function claimsOf(ctx: ActiveContext): RlsClaims {
  return { sub: ctx.userId, email: ctx.email };
}
