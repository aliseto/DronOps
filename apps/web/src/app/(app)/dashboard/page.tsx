import { getTranslations } from "next-intl/server";
import { Card, PageHeader, StatusPill } from "@dronops/ui";

export default async function DashboardPage() {
  const t = await getTranslations("pages.dashboard");
  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="p-6">
        <Card title={t("exceptions")}>
          {/* Exceptions-first: a good-empty state for the foundation. */}
          <p className="text-small text-fg-muted">{t("nothing")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {/* StatusPill showcase — verifies the single status source renders. */}
            <StatusPill domain="mission" status="sealed" />
            <StatusPill domain="currency" status="expiring" detail="12 d" />
            <StatusPill domain="ncr" status="open" />
            <StatusPill domain="asset" status="grounded" />
            <StatusPill domain="coverage" status="partial" />
            <StatusPill domain="document" status="effective" />
          </div>
        </Card>
      </div>
    </>
  );
}
