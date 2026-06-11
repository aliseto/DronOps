import { getTranslations } from "next-intl/server";

/** Offline fallback served by the service worker when a navigation fails. */
export default async function OfflinePage() {
  const t = await getTranslations("pages.offline");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-title font-semibold text-fg-primary">{t("title")}</h1>
      <p className="max-w-md text-small text-fg-muted">{t("description")}</p>
    </main>
  );
}
