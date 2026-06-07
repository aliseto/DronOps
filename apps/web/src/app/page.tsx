import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("home");
  return (
    <main style={{ padding: "3rem", maxWidth: "48rem", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 650 }}>{t("title")}</h1>
      <p style={{ color: "#8d9399" }}>{t("subtitle")}</p>
      <p
        data-testid="foundation-badge"
        style={{
          marginTop: "1.5rem",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.8125rem",
        }}
      >
        {t("foundation")}
      </p>
    </main>
  );
}
