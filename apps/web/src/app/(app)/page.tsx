import Link from "next/link";
import { Badge, Button, Card, EmptyState, PageHeader } from "@dronops/ui";
import { schema } from "@dom/db";
import { getSessionUser } from "@/lib/session";
import { withRls } from "@/lib/db";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null; // (app)/layout already redirects

  const claims = { sub: user.id, email: user.email };
  const { orgs, tenantRoles } = await withRls(claims, async (db) => ({
    orgs: await db.select().from(schema.organisations),
    tenantRoles: await db.select().from(schema.userTenantRoles),
  }));

  const provisioned = tenantRoles.length > 0 || orgs.length > 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={provisioned ? "Your organisations and what needs you." : undefined}
      />
      <div className="p-6">
        {!provisioned ? (
          <EmptyState
            variant="first-use"
            title="Set up your operation"
            description="Create your tenant and first organisation to start managing fleet, crew and operations."
            action={
              <Link href="/onboarding">
                <Button>Create tenant &amp; organisation</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {orgs.map((o) => (
              <Card key={o.id} title={o.name}>
                <div className="flex items-center gap-2 text-small text-fg-muted">
                  <Badge tone="neutral">{o.jurisdiction ?? "—"}</Badge>
                  <span>{o.status}</span>
                </div>
              </Card>
            ))}
            {orgs.length === 0 && (
              <Card title="No organisations yet">
                <Link href="/onboarding" className="inline-block">
                  <Button variant="secondary" size="sm">
                    Create an organisation
                  </Button>
                </Link>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  );
}
