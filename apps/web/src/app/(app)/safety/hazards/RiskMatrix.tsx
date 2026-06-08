"use client";

import { riskCell, SEVERITY_LABELS, LIKELIHOOD_LABELS, type RiskBand } from "@dronops/shared";

const BAND_CELL: Record<RiskBand, string> = {
  low: "bg-status-ok-bg text-status-ok-fg",
  medium: "bg-status-warn-bg text-status-warn-fg",
  high: "bg-status-danger-bg text-status-danger-fg",
};

const BAND_CHIP: Record<RiskBand, string> = {
  low: "bg-status-ok-bg text-status-ok-fg",
  medium: "bg-status-warn-bg text-status-warn-fg",
  high: "bg-status-danger-bg text-status-danger-fg",
};

export function BandChip({ band, score }: { band: RiskBand | null; score?: number | null }) {
  if (!band) return <span className="text-micro text-fg-muted">—</span>;
  const label = band.charAt(0).toUpperCase() + band.slice(1);
  return (
    <span className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-micro font-medium tabular-nums ${BAND_CHIP[band]}`}>
      {label}{score != null ? ` · ${score}` : ""}
    </span>
  );
}

/**
 * The 5×5 risk matrix grid. Rows = severity (5→1, top to bottom), cols =
 * likelihood (1→5). Marks the inherent (▣) and residual (▢) cells; clickable
 * when onPick is given (sets severity+likelihood for the active target).
 */
export function RiskMatrix({
  inherent,
  residual,
  onPick,
}: {
  inherent?: { severity: number | null; likelihood: number | null };
  residual?: { severity: number | null; likelihood: number | null };
  onPick?: (severity: number, likelihood: number) => void;
}) {
  const severities = [5, 4, 3, 2, 1];
  const likelihoods = [1, 2, 3, 4, 5];
  const is = (t: { severity: number | null; likelihood: number | null } | undefined, s: number, l: number) =>
    t != null && t.severity === s && t.likelihood === l;

  return (
    <div className="inline-grid select-none gap-1" style={{ gridTemplateColumns: `auto repeat(5, 2rem)` }}>
      <div />
      {likelihoods.map((l) => (
        <div key={`h${l}`} className="text-center text-micro text-fg-muted" title={LIKELIHOOD_LABELS[l]}>{l}</div>
      ))}
      {severities.map((s) => (
        <RowFragment key={`r${s}`} s={s} likelihoods={likelihoods} inherent={inherent} residual={residual} onPick={onPick} isMark={is} />
      ))}
      <div />
      <div className="col-span-5 mt-0.5 text-center text-micro text-fg-muted">Likelihood →</div>
    </div>
  );
}

function RowFragment({
  s,
  likelihoods,
  inherent,
  residual,
  onPick,
  isMark,
}: {
  s: number;
  likelihoods: number[];
  inherent?: { severity: number | null; likelihood: number | null };
  residual?: { severity: number | null; likelihood: number | null };
  onPick?: (severity: number, likelihood: number) => void;
  isMark: (t: { severity: number | null; likelihood: number | null } | undefined, s: number, l: number) => boolean;
}) {
  return (
    <>
      <div className="flex items-center justify-end pr-1 text-micro text-fg-muted" title={SEVERITY_LABELS[s]}>{s}</div>
      {likelihoods.map((l) => {
        const band = riskCell(s, l)!.band;
        const inh = isMark(inherent, s, l);
        const res = isMark(residual, s, l);
        return (
          <button
            key={`${s}-${l}`}
            type="button"
            disabled={!onPick}
            onClick={() => onPick?.(s, l)}
            className={`flex h-8 w-8 items-center justify-center rounded text-micro font-medium ${BAND_CELL[band]} ${onPick ? "cursor-pointer ring-offset-1 hover:ring-2 hover:ring-accent" : "cursor-default"} ${inh || res ? "ring-2 ring-fg-primary" : ""}`}
            title={`Severity ${s} × Likelihood ${l} = ${s * l} (${band})`}
          >
            {inh ? "▣" : res ? "▢" : ""}
          </button>
        );
      })}
    </>
  );
}
