import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * StatusPill is the ONLY way to render a record status (DESIGN_SYSTEM §4.1,
 * CLAUDE.md conventions). State is always color + icon + text, never color
 * alone. Each (domain, status) maps to a tone, a label, and an icon.
 */

export type StatusTone = "ok" | "warn" | "danger" | "info" | "neutral";

export interface StatusVocab {
  currency: "current" | "expiring" | "lapsed" | "unverified";
  asset: "operational" | "due-soon" | "in-maintenance" | "grounded";
  mission: "draft" | "pending-approval" | "approved" | "in-progress" | "reconciling" | "sealed";
  ncr: "open" | "containment" | "capa-in-progress" | "verify" | "closed" | "false-positive";
  document: "draft" | "in-review" | "effective" | "obsolete";
  coverage: "covered" | "partial" | "gap" | "n-a";
}

export type StatusDomain = keyof StatusVocab;

type Entry = { tone: StatusTone; label: string; lock?: boolean };

const REGISTRY: { [D in StatusDomain]: { [S in StatusVocab[D]]: Entry } } = {
  currency: {
    current: { tone: "ok", label: "Current" },
    expiring: { tone: "warn", label: "Expiring" },
    lapsed: { tone: "danger", label: "Lapsed" },
    unverified: { tone: "neutral", label: "Unverified" },
  },
  asset: {
    operational: { tone: "ok", label: "Operational" },
    "due-soon": { tone: "warn", label: "Due soon" },
    "in-maintenance": { tone: "info", label: "In maintenance" },
    grounded: { tone: "danger", label: "Grounded" },
  },
  mission: {
    draft: { tone: "neutral", label: "Draft" },
    "pending-approval": { tone: "warn", label: "Pending approval" },
    approved: { tone: "ok", label: "Approved" },
    "in-progress": { tone: "info", label: "In progress" },
    reconciling: { tone: "info", label: "Reconciling" },
    sealed: { tone: "ok", label: "Sealed", lock: true },
  },
  ncr: {
    open: { tone: "danger", label: "Open" },
    containment: { tone: "warn", label: "Containment" },
    "capa-in-progress": { tone: "info", label: "CAPA in progress" },
    verify: { tone: "warn", label: "Verify" },
    closed: { tone: "ok", label: "Closed" },
    "false-positive": { tone: "neutral", label: "False positive" },
  },
  document: {
    draft: { tone: "neutral", label: "Draft" },
    "in-review": { tone: "warn", label: "In review" },
    effective: { tone: "ok", label: "Effective" },
    obsolete: { tone: "neutral", label: "Obsolete" },
  },
  coverage: {
    covered: { tone: "ok", label: "Covered" },
    partial: { tone: "warn", label: "Partial" },
    gap: { tone: "danger", label: "Gap" },
    "n-a": { tone: "neutral", label: "N/A" },
  },
};

const toneClass: Record<StatusTone, string> = {
  ok: "bg-status-ok-bg text-status-ok-fg",
  warn: "bg-status-warn-bg text-status-warn-fg",
  danger: "bg-status-danger-bg text-status-danger-fg",
  info: "bg-status-info-bg text-status-info-fg",
  neutral: "bg-status-neutral-bg text-status-neutral-fg",
};

function ToneIcon({ tone }: { tone: StatusTone }) {
  // Distinct glyph per tone so state never relies on color alone.
  const common = { width: 12, height: 12, viewBox: "0 0 16 16", "aria-hidden": true } as const;
  switch (tone) {
    case "ok":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 8.5l3.5 3.5L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "warn":
      return (
        <svg {...common} fill="currentColor">
          <path d="M8 1.5l6.5 11.5h-13z M7.2 6h1.6v3.5H7.2z M7.2 10.5h1.6v1.6H7.2z" />
        </svg>
      );
    case "danger":
      return (
        <svg {...common} fill="currentColor">
          <circle cx="8" cy="8" r="6.5" />
          <rect x="7.2" y="4.3" width="1.6" height="4.6" fill="var(--bg-surface)" />
          <rect x="7.2" y="10" width="1.6" height="1.6" fill="var(--bg-surface)" />
        </svg>
      );
    case "info":
      return (
        <svg {...common} fill="currentColor">
          <circle cx="8" cy="8" r="6.5" />
          <rect x="7.2" y="7" width="1.6" height="4.6" fill="var(--bg-surface)" />
          <rect x="7.2" y="4.4" width="1.6" height="1.6" fill="var(--bg-surface)" />
        </svg>
      );
    case "neutral":
      return (
        <svg {...common} fill="currentColor">
          <circle cx="8" cy="8" r="3" />
        </svg>
      );
  }
}

function LockIcon() {
  return (
    <svg width={11} height={11} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M4.5 7V5a3.5 3.5 0 117 0v2H13v7H3V7h1.5zm1.5 0h4V5a2 2 0 10-4 0v2z" />
    </svg>
  );
}

export interface StatusPillProps<D extends StatusDomain> {
  domain: D;
  status: StatusVocab[D];
  /** Optional suffix, e.g. days for "Expiring (12 d)". */
  detail?: ReactNode;
  className?: string;
}

export function StatusPill<D extends StatusDomain>({
  domain,
  status,
  detail,
  className,
}: StatusPillProps<D>) {
  const entry: Entry = (REGISTRY[domain] as Record<string, Entry>)[status] ?? {
    tone: "neutral",
    label: String(status),
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-micro font-medium",
        toneClass[entry.tone],
        className,
      )}
    >
      {entry.lock ? <LockIcon /> : <ToneIcon tone={entry.tone} />}
      <span>{entry.label}</span>
      {detail != null && <span className="tabular-nums opacity-80">{detail}</span>}
    </span>
  );
}
