import { Card, EmptyState } from "@dronops/ui";
import type { SafetyDashboard } from "@dronops/shared";

const fmtMonth = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y!, (m ?? 1) - 1, 1)).toLocaleString("en", { month: "short", timeZone: "UTC" });
};
const pretty = (code: string) => code.replace(/_/g, " ");

function Metric({ value, label, tone, sub }: { value: string | number; label: string; tone?: "danger" | "warn"; sub?: string }) {
  const c = tone === "danger" ? "text-status-danger-fg" : tone === "warn" ? "text-status-warn-fg" : "text-fg-primary";
  return (
    <div className="rounded-lg bg-bg-inset px-3 py-2.5">
      <div className={`font-mono text-2xl font-bold tabular-nums leading-tight ${c}`}>{value}</div>
      <div className="mt-0.5 text-micro text-fg-muted">{label}</div>
      {sub && <div className="text-micro text-fg-muted">{sub}</div>}
    </div>
  );
}

export function SafetyDashboardView({ data }: { data: SafetyDashboard | null }) {
  if (!data) {
    return <EmptyState title="No safety data yet" description="Occurrence rates and leading indicators appear once flights and occurrences are recorded." />;
  }
  const d = data;
  const maxTrend = Math.max(1, ...d.trend.map((t) => t.occurrences));
  const totalResidual = d.hazards.byResidual.low + d.hazards.byResidual.medium + d.hazards.byResidual.high + d.hazards.unscored;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-display text-fg-primary">Safety performance</h1>
        <p className="text-small text-fg-muted">Leading indicators over the last {d.window.days} days. Point-in-time figures are as of now.</p>
      </div>

      <Card title={`Headline — last ${d.window.days} days`}>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Metric value={d.occurrenceRatePer100 ?? "—"} label="Occurrences / 100 flights" sub={`${d.occurrences.inWindow} occ · ${d.flights.inWindow} flights`} />
          <Metric value={d.occurrences.openInvestigations} label="Open investigations" tone={d.occurrences.openInvestigations ? "warn" : undefined} />
          <Metric value={d.occurrences.overdueReporting} label="Overdue regulator reports" tone={d.occurrences.overdueReporting ? "danger" : undefined} />
          <Metric value={d.deviations.inWindow} label="Flight deviations" tone={d.deviations.inWindow ? "warn" : undefined} />
        </div>
        <p className="mt-2 text-micro text-fg-muted">
          In window: {d.occurrences.byClass.accident} accident · {d.occurrences.byClass.incident} incident · {d.occurrences.byClass.hazard_observation} hazard observation
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Occurrence trend">
          <div className="flex items-end gap-2" style={{ height: "8rem" }}>
            {d.trend.map((t) => (
              <div key={t.month} className="flex flex-1 flex-col items-center justify-end gap-1">
                <span className="font-mono text-micro tabular-nums text-fg-muted">{t.occurrences || ""}</span>
                <div className="w-full rounded-t bg-accent" style={{ height: `${(t.occurrences / maxTrend) * 100}%`, minHeight: t.occurrences ? "4px" : "0" }} />
                <span className="text-micro text-fg-muted">{fmtMonth(t.month)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Top deviation types (window)">
          {d.deviations.top.length === 0 ? (
            <p className="text-small text-fg-muted">No flight deviations in the window.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {d.deviations.top.map((t) => (
                <div key={t.code} className="flex items-center gap-2">
                  <span className="w-40 truncate text-small text-fg-primary">{pretty(t.code)}</span>
                  <div className="h-3 flex-1 rounded bg-bg-inset">
                    <div className="h-3 rounded bg-status-warn-fg/70" style={{ width: `${(t.count / d.deviations.top[0]!.count) * 100}%` }} />
                  </div>
                  <span className="w-6 text-right font-mono text-micro tabular-nums text-fg-secondary">{t.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Hazard register">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Metric value={d.hazards.open} label="Open hazards" />
          <Metric value={d.hazards.byResidual.high} label="High residual" tone={d.hazards.byResidual.high ? "danger" : undefined} />
          <Metric value={d.hazards.byResidual.medium} label="Medium residual" tone={d.hazards.byResidual.medium ? "warn" : undefined} />
          <Metric value={d.hazards.overdueReviews} label="Overdue reviews" tone={d.hazards.overdueReviews ? "danger" : undefined} />
        </div>
        {totalResidual > 0 && (
          <div className="mt-3 flex h-2.5 overflow-hidden rounded-pill">
            {d.hazards.byResidual.high > 0 && <div className="bg-status-danger-fg" style={{ width: `${(d.hazards.byResidual.high / totalResidual) * 100}%` }} title={`${d.hazards.byResidual.high} high`} />}
            {d.hazards.byResidual.medium > 0 && <div className="bg-status-warn-fg" style={{ width: `${(d.hazards.byResidual.medium / totalResidual) * 100}%` }} title={`${d.hazards.byResidual.medium} medium`} />}
            {d.hazards.byResidual.low > 0 && <div className="bg-status-ok-fg" style={{ width: `${(d.hazards.byResidual.low / totalResidual) * 100}%` }} title={`${d.hazards.byResidual.low} low`} />}
            {d.hazards.unscored > 0 && <div className="bg-strong" style={{ width: `${(d.hazards.unscored / totalResidual) * 100}%` }} title={`${d.hazards.unscored} unscored`} />}
          </div>
        )}
        <p className="mt-2 text-micro text-fg-muted">Residual-risk profile of open hazards{d.hazards.unscored ? ` · ${d.hazards.unscored} not yet scored` : ""}.</p>
      </Card>
    </div>
  );
}
