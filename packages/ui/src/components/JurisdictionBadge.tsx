import { cn } from "../lib/cn";

/** Neutral-tinted jurisdiction chip (DESIGN_SYSTEM §4.2). Used on missions,
 * occurrences, requirements, registrations. Self-contained label map so the UI
 * package stays content-free. */
const LABELS: Record<string, string> = {
  "UAE-Federal": "UAE — Federal",
  "UAE-Dubai": "UAE — Dubai",
  KSA: "KSA",
  Oman: "Oman",
  ISO: "ISO 9001",
};

export function JurisdictionBadge({
  jurisdiction,
  className,
}: {
  jurisdiction: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill bg-inset px-2 py-0.5 text-micro font-medium text-fg-secondary",
        className,
      )}
    >
      {LABELS[jurisdiction] ?? jurisdiction}
    </span>
  );
}
