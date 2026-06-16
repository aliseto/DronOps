import { redirect } from "next/navigation";
import { Button, Card, PageHeader } from "@dronops/ui";
import { sql } from "drizzle-orm";
import { ROLE_LABELS, type Role } from "@dom/core";
import { getSessionUser } from "@/lib/session";
import { withRls } from "@/lib/db";
import { acceptInvitationAction } from "./actions";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const token = sp.token;
  const invite = token
    ? ((await withRls({ sub: user!.id, email: user!.email }, (db) =>
        db.execute(
          sql`select email, role, org_id from public.invitations where token_hash = ${token} and status = 'pending'`,
        ),
      )) as unknown as { email: string; role: string; org_id: string | null }[])[0]
    : undefined;

  return (
    <>
      <PageHeader title="Invitation" />
      <div className="p-6">
        <Card title="Accept invitation" className="max-w-md">
          {!token ? (
            <p className="text-small text-fg-muted">No invitation token provided.</p>
          ) : !invite ? (
            <p className="text-small text-fg-muted">
              This invitation isn&apos;t available for your account ({user!.email}). Make sure you&apos;re
              signed in with the invited email address.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-small text-fg-secondary">
                You&apos;ve been invited as{" "}
                <span className="font-medium text-fg-primary">
                  {ROLE_LABELS[invite.role as Role] ?? invite.role}
                </span>
                {invite.org_id ? " in an organisation" : " across the tenant"}.
              </p>
              {sp.error && <p className="text-micro text-status-danger-fg">{sp.error}</p>}
              <form action={acceptInvitationAction}>
                <input type="hidden" name="token" value={token} />
                <Button type="submit">Accept invitation</Button>
              </form>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
