import type { DeadlineStatusDTO } from "@/server/safety";

function fmtRemaining(ms: number): string {
  const abs = Math.abs(ms);
  const d = Math.floor(abs / 86_400_000);
  const h = Math.floor((abs % 86_400_000) / 3_600_000);
  const m = Math.floor((abs % 3_600_000) / 60_000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

type Tone = "danger" | "warn" | "success" | "neutral";

export function deadlineState(d: DeadlineStatusDTO): { label: string; tone: Tone } {
  if (!d.applicable) return { label: "Internal — no clock", tone: "neutral" };
  if (d.satisfied) return { label: "Reported", tone: "success" };
  if (d.immediate) return { label: "Report immediately", tone: "danger" };
  if (d.overdue) return { label: `Overdue ${d.remainingMs != null ? fmtRemaining(d.remainingMs) : ""}`.trim(), tone: "danger" };
  return { label: `${d.remainingMs != null ? fmtRemaining(d.remainingMs) : "—"} left`, tone: "warn" };
}

const TONE: Record<Tone, string> = {
  danger: "bg-status-danger-bg text-status-danger-fg",
  warn: "bg-status-warn-bg text-status-warn-fg",
  success: "bg-status-ok-bg text-status-ok-fg",
  neutral: "bg-status-neutral-bg text-fg-muted",
};

/** The reporting-deadline chip — the headline of the safety screen. */
export function DeadlineChip({ deadline, className }: { deadline: DeadlineStatusDTO; className?: string }) {
  const s = deadlineState(deadline);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-small font-medium tabular-nums ${TONE[s.tone]} ${className ?? ""}`}>
      {(s.tone === "danger" || deadline.immediate) && <span aria-hidden>⏰</span>}
      {s.label}
    </span>
  );
}
