import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, EmptyState, PageHeader, StatusPill } from "@dronops/ui";
import type { GroupedObligations, Obligation, ObligationSeverity } from "@dronops/shared";
import { getCurrentUser } from "@/lib/session";
import { getActiveOrgId } from "@/server/active-org";
import { listObligations } from "@/server/obligations";

/**
 * The exceptions-first dashboard (UX_SYSTEM §1.3/§9): an inbox of obligations,
 * not a gallery of metrics. Each row = what is owed, when it is due, one click
 * to the exact record. Counts come from the same query that renders the list.
 */
export default async function DashboardPage() {
  const t = await getTranslations("pages.dashboard");
  const user = await getCurrentUser();

  // Best-effort: the dashboard must render without a data layer (e2e/dev) —
  // it degrades to the good-empty state, never to an error.
  let grouped: GroupedObligations = { overdue: [], dueSoon: [], open: [], total: 0 };
  try {
    const orgId = user?.id ? await getActiveOrgId(user.id) : null;
    if (orgId && user?.id) grouped = await listObligations(orgId, user.id);
  } catch {
    /* degrade to empty */
  }

  const sections: Array<{ key: string; label: string; severity: ObligationSeverity; items: Obligation[] }> = [
    { key: "overdue", label: t("overdue"), severity: "overdue", items: grouped.overdue },
    { key: "dueSoon", label: t("dueSoon"), severity: "due-soon", items: grouped.dueSoon },
    { key: "open", label: t("open"), severity: "open", items: grouped.open },
  ];

  return (
    <>
      <PageHeader
        title={t("title")}
        description={grouped.total > 0 ? `${grouped.total} ${t("needsYou")}` : t("description")}
      />
      <div className="p-6">
        <Card title={t("exceptions")}>
          {grouped.total === 0 ? (
            <EmptyState variant="good" title={t("nothing")} />
          ) : (
            <div className="flex flex-col gap-4">
              {sections
                .filter((s) => s.items.length > 0)
                .map((s) => (
                  <section key={s.key} aria-label={s.label}>
                    <div className="mb-1 flex items-center gap-2">
                      <StatusPill domain="obligation" status={s.severity} detail={s.items.length} />
                    </div>
                    <ul className="flex flex-col gap-2">
                      {s.items.map((o) => (
                        <li key={o.key}>
                          <Link
                            href={o.href}
                            className="flex items-center justify-between gap-3 rounded-md border border-subtle bg-inset px-3 py-2 text-small text-fg-primary hover:border-default hover:text-accent"
                          >
                            <span className="min-w-0">
                              <span className="block truncate">{o.title}</span>
                              {o.detail && (
                                <span className="block truncate font-mono text-micro text-fg-muted">
                                  {o.detail}
                                </span>
                              )}
                            </span>
                            {o.dueAt && (
                              <span className="shrink-0 font-mono text-micro tabular-nums text-fg-muted">
                                {new Date(o.dueAt).toLocaleDateString()}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
