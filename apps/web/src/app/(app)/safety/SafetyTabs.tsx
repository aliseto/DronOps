import Link from "next/link";

type Tab = "occurrences" | "hazards" | "dashboard";

/** Sub-navigation for the M3 Safety module. */
export function SafetyTabs({ active }: { active: Tab }) {
  const tab = (href: string, key: Tab, label: string) => (
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
      {tab("/safety/dashboard", "dashboard", "Dashboard")}
    </nav>
  );
}
