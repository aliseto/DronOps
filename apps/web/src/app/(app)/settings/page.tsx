import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button, Card, PageHeader } from "@dronops/ui";

export default async function SettingsPage() {
  const t = await getTranslations("pages.settings");
  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="grid gap-4 p-6 md:grid-cols-2">
        <Card title="Organization & jurisdictions">
          <p className="text-small text-fg-muted">
            Create your organization, enable jurisdictions and invite members.
          </p>
          <Link href="/onboarding" className="mt-3 inline-block">
            <Button variant="secondary" size="sm">
              Open setup checklist
            </Button>
          </Link>
        </Card>
        <Card title="Security">
          <p className="text-small text-fg-muted">Passkeys for signing consequential actions.</p>
          <Link href="/settings/security" className="mt-3 inline-block">
            <Button variant="secondary" size="sm">
              Manage passkeys
            </Button>
          </Link>
        </Card>
      </div>
    </>
  );
}
