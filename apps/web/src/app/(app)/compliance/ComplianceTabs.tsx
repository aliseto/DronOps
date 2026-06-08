import Link from "next/link";

/** Sub-navigation for the M2 Compliance module: findings vs the coverage matrix. */
export function ComplianceTabs({ active }: { active: "findings" | "coverage" | "reviews" }) {
  const tab = (href: string, key: "findings" | "coverage" | "reviews", label: string) => (
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
      {tab("/compliance", "findings", "Findings")}
      {tab("/compliance/coverage", "coverage", "Coverage")}
      {tab("/compliance/reviews", "reviews", "Reviews")}
    </nav>
  );
}
