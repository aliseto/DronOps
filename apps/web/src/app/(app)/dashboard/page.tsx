import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, EmptyState, PageHeader, StatusPill } from "@dronops/ui";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { getCurrentPersonId } from "@/server/rbac";
import { myAcksDue } from "@/server/distributions";

export default async function DashboardPage() {
  const t = await getTranslations("pages.dashboard");
  const user = await getCurrentUser();

  // Personal obligations (UX_SYSTEM §1.3) — my acks due, not org totals.
  // Best-effort: the dashboard must still render if the data layer is
  // unavailable (e.g. no DB configured), so it degrades to no obligations.
  let acksDue: Awaited<ReturnType<typeof myAcksDue>> = [];
  try {
    const orgId = user?.id ? await getActiveOrgId(user.id) : null;
    const personId = orgId && user?.id ? await getCurrentPersonId(orgId, user.id) : null;
    if (orgId && personId) acksDue = await myAcksDue(orgId, personId);
  } catch {
    acksDue = [];
  }

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="p-6">
        <Card title={t("exceptions")}>
          {acksDue.length === 0 ? (
            <EmptyState variant="good" title={t("nothing")} />
          ) : (
            <ul className="flex flex-col gap-2">
              {acksDue.map((a) => (
                <li
                  key={a.distributionId}
                  className="flex items-center justify-between rounded-md border border-subtle bg-inset px-3 py-2 text-small"
                >
                  <Link href="/documents" className="text-fg-primary hover:text-accent">
                    Acknowledge{" "}
                    <span className="font-mono">{a.docNo}</span> rev {a.revNo} — {a.title}
                  </Link>
                  {a.overdue ? (
                    <StatusPill domain="currency" status="lapsed" detail="overdue" />
                  ) : a.dueAt ? (
                    <StatusPill
                      domain="currency"
                      status="expiring"
                      detail={`due ${new Date(a.dueAt).toLocaleDateString()}`}
                    />
                  ) : (
                    <StatusPill domain="currency" status="unverified" detail="ack due" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
