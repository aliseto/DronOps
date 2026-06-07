import type { ReactNode } from "react";
import { Card } from "./Card";
import { ReadinessVerdict, type ReadinessCheckView } from "./ReadinessVerdict";
import { StatusPill, type StatusVocab } from "./StatusPill";
import { cn } from "../lib/cn";

/**
 * CurrencyCard — a person's fit-to-fly summary for one airframe class under one
 * jurisdiction, plus (optionally) the wallet credentials feeding it. Composes
 * ReadinessVerdict; pure presentational.
 */
export interface CurrencyCardProps {
  personName: string;
  airframeClass: string;
  jurisdictionLabel: string;
  verdict: StatusVocab["readiness"];
  checks: ReadinessCheckView[];
  actions?: ReactNode;
  className?: string;
}

export function CurrencyCard({
  personName,
  airframeClass,
  jurisdictionLabel,
  verdict,
  checks,
  actions,
  className,
}: CurrencyCardProps) {
  return (
    <Card
      className={className}
      title={
        <span className="flex flex-col">
          <span className="text-body font-semibold text-fg-primary">{personName}</span>
          <span className="text-micro font-normal text-fg-muted">
            {airframeClass} · {jurisdictionLabel}
          </span>
        </span>
      }
      actions={actions}
    >
      <ReadinessVerdict verdict={verdict} checks={checks} />
    </Card>
  );
}

/** Compact one-line currency chip for rosters/tables. */
export function CurrencyChip({
  label,
  status,
  detail,
  className,
}: {
  label: string;
  status: StatusVocab["currency"];
  detail?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="text-micro text-fg-muted">{label}</span>
      <StatusPill domain="currency" status={status} detail={detail} />
    </span>
  );
}
