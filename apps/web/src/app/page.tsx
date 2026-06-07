import { useTranslations } from "next-intl";
import { ThemeToggle } from "@dronops/ui";

export default function HomePage() {
  const t = useTranslations("home");
  return (
    <main className="mx-auto max-w-2xl p-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-title font-semibold text-fg-primary">{t("title")}</h1>
          <p className="mt-1 text-body text-fg-muted">{t("subtitle")}</p>
        </div>
        <ThemeToggle className="rounded-md border border-default bg-surface px-3 py-1.5 text-small text-fg-secondary hover:bg-hover" />
      </div>
      <p
        data-testid="foundation-badge"
        className="mt-6 inline-block rounded-pill border border-subtle bg-inset px-3 py-1 font-mono text-mono text-status-ok-fg"
      >
        {t("foundation")}
      </p>
    </main>
  );
}
