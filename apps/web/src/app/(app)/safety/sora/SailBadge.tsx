// SAIL badge. SAIL 0 = out of SORA (certified category).
const TONE: Record<number, string> = {
  0: "bg-status-neutral-bg text-fg-muted",
  1: "bg-status-ok-bg text-status-ok-fg",
  2: "bg-status-ok-bg text-status-ok-fg",
  3: "bg-status-warn-bg text-status-warn-fg",
  4: "bg-status-warn-bg text-status-warn-fg",
  5: "bg-status-danger-bg text-status-danger-fg",
  6: "bg-status-danger-bg text-status-danger-fg",
};

export function SailBadge({ sail, roman, large }: { sail: number; roman: string; large?: boolean }) {
  const tone = TONE[sail] ?? TONE[0]!;
  if (sail === 0) {
    return <span className={`inline-flex items-center rounded-pill px-2 py-0.5 text-micro font-medium ${tone}`}>Out of SORA</span>;
  }
  return (
    <span className={`inline-flex items-center justify-center rounded-md font-bold tabular-nums ${tone} ${large ? "h-14 w-14 text-2xl" : "px-2 py-0.5 text-small"}`}>
      {large ? roman : `SAIL ${roman}`}
    </span>
  );
}
