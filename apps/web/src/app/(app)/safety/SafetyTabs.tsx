import Link from "next/link";

/** Sub-navigation for the M3 Safety module: occurrence reports vs the hazard register. */
export function SafetyTabs({ active }: { active: "occurrences" | "hazards" }) {
  const tab = (href: string, key: "occurrences" | "hazards", label: string) => (
    <Link
      href={href}
      className={`border-b-2 px-1 pb-2 text-small font-medium ${
        active === key ? "border-accent text-fg-primary" : "border-transparent text-fg-muted hover:text-fg-secondary"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <nav className="flex gap-5 border-b border-subtle">
      {tab("/safety", "occurrences", "Occurrences")}
      {tab("/safety/hazards", "hazards", "Hazard register")}
    </nav>
  );
}
