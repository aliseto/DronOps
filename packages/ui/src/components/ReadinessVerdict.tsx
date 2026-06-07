import { StatusPill, type StatusVocab } from "./StatusPill";
import { cn } from "../lib/cn";

/**
 * Renders a fit-to-fly verdict + its per-requirement checks. Presentational: it
 * takes the shape the currency engine (@dronops/shared `fitToFly`) returns but
 * imports no engine code, so it stays in the UI layer. Verdict and each check
 * are rendered through StatusPill — the single status source (CLAUDE.md).
 */
export interface ReadinessCheckView {
  key: string;
  label: string;
  status: StatusVocab["currency"];
  clause?: string;
  detail?: string;
}

export interface ReadinessVerdictProps {
  verdict: StatusVocab["readiness"];
  checks: ReadinessCheckView[];
  /** Optional context line, e.g. "Multirotor · Oman". */
  context?: string;
  className?: string;
}

export function ReadinessVerdict({ verdict, checks, context, className }: ReadinessVerdictProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <StatusPill domain="readiness" status={verdict} />
        {context && <span className="text-micro text-fg-muted">{context}</span>}
      </div>
      {checks.length === 0 ? (
        <p className="text-micro text-fg-muted">No flying requirements in this mode.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {checks.map((c) => (
            <li key={c.key} className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-body text-fg-primary">{c.label}</span>
                {(c.clause || c.detail) && (
                  <span className="truncate text-micro text-fg-muted tabular-nums">
                    {[c.detail, c.clause].filter(Boolean).join(" · ")}
                  </span>
                )}
              </span>
              <StatusPill domain="currency" status={c.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
