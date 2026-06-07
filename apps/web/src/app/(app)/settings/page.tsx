import { getTranslations } from "next-intl/server";
import { Card, PageHeader } from "@dronops/ui";

export default async function SettingsPage() {
  const t = await getTranslations("pages.settings");
  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="p-6">
        <Card title="Jurisdictions">
          <p className="text-small text-fg-muted">{t("jurisdictionsNote")}</p>
        </Card>
      </div>
    </>
  );
}
