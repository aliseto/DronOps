import {
  CREDENTIAL_ALERT_WINDOWS_DAYS,
  CURRENCY_REQUIREMENTS,
  KNOWLEDGE_RECENCY_GATES,
  MEDICAL_GATES,
  OPERATOR_RECENCY_DEFAULT,
  getCredentialKind,
  type OperatorRecencyRule,
} from "@dronops/content";
import type { Jurisdiction } from "../jurisdiction/engine";

/**
 * Currency engine — pure functions that read @dronops/content currency rules and
 * a person's wallet + recency events to produce a fit-to-fly verdict per person
 * per airframe class per jurisdiction. NO regulator value is embedded here (every
 * window, month count and requirement set comes from content).
 *
 * ── M6 SEAM ──────────────────────────────────────────────────────────────────
 * Recency is event-driven. `RecencyEvent`s with source "m6_flight" are written by
 * M6 flight reconciliation when that module lands; until then the engine is
 * exercised against source "manual"/"import" events (and synthetic events in
 * tests). The engine consumes events only — it never reaches into flights — so
 * wiring M6 is purely a matter of inserting recency_events rows. Do not block M7
 * on M6.
 */

/** Mirrors StatusPill's `currency` vocabulary so screens render it directly. */
export type CurrencyStatus = "current" | "expiring" | "lapsed" | "unverified";

const DAY_MS = 86_400_000;

function addMonthsUTC(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + months, 1);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

const daysBetween = (from: Date, to: Date) => Math.floor((to.getTime() - from.getTime()) / DAY_MS);

// ───────────────────────────────────────────────────────────── credentials
export interface CredentialInput {
  kind: string;
  /** Operator-verified external credential (vs. self-asserted/unconfirmed). */
  verified: boolean;
  /** null when the kind does not expire (e.g. standing endorsements). */
  expiresAt: Date | null;
}

export interface CredentialCurrency {
  status: CurrencyStatus;
  daysUntilExpiry: number | null;
  /** Alert window the credential has entered, if any (60/30/7). */
  alertWindow: number | null;
}

/**
 * Currency of a single wallet credential. Precedence: expired → lapsed;
 * unverified → unverified; within an alert window → expiring; else current.
 * A standing (non-expiring) verified credential is always current.
 */
export function credentialCurrency(
  credential: CredentialInput,
  now: Date,
  windows: readonly number[] = CREDENTIAL_ALERT_WINDOWS_DAYS,
): CredentialCurrency {
  if (credential.expiresAt === null) {
    return { status: credential.verified ? "current" : "unverified", daysUntilExpiry: null, alertWindow: null };
  }
  const days = daysBetween(now, credential.expiresAt);
  if (days < 0) return { status: "lapsed", daysUntilExpiry: days, alertWindow: null };
  if (!credential.verified) return { status: "unverified", daysUntilExpiry: days, alertWindow: null };
  const hit = [...windows].sort((a, b) => a - b).find((w) => days <= w) ?? null;
  return { status: hit !== null ? "expiring" : "current", daysUntilExpiry: days, alertWindow: hit };
}

// ──────────────────────────────────────────────────────────────── recency
export const RECENCY_EVENT_SOURCES = ["manual", "import", "m6_flight"] as const;
export type RecencyEventSource = (typeof RECENCY_EVENT_SOURCES)[number];

export interface RecencyEvent {
  /** "flight" for operator recency, or a gate eventType e.g. "knowledge_recency". */
  eventType: string;
  /** Airframe class the event counts toward (operator rule is per-class). */
  airframeClass: string | null;
  occurredAt: Date;
  source: RecencyEventSource;
}

export interface RecencyCurrency {
  status: CurrencyStatus;
  /** Qualifying events inside the window (operator rule). */
  count?: number;
  /** Date the rule lapses if no further qualifying activity. */
  lapsesAt?: Date | null;
  clause: string;
}

/**
 * Operator recency (≥N flights / window days, per airframe class). Counts flight
 * events for the class inside the window; current when count ≥ min. `lapsesAt`
 * is when the Nth-most-recent qualifying flight rolls out of the window —
 * "expiring" once that is within the rule's lead time.
 */
export function operatorRecencyCurrency(
  events: readonly RecencyEvent[],
  airframeClass: string,
  now: Date,
  rule: OperatorRecencyRule = OPERATOR_RECENCY_DEFAULT,
): RecencyCurrency {
  const windowStart = new Date(now.getTime() - rule.windowDays * DAY_MS);
  const qualifying = events
    .filter(
      (e) =>
        e.eventType === "flight" &&
        (!rule.perAirframeClass || e.airframeClass === airframeClass) &&
        e.occurredAt >= windowStart &&
        e.occurredAt <= now,
    )
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

  if (qualifying.length < rule.minFlights) {
    return { status: "lapsed", count: qualifying.length, lapsesAt: null, clause: rule.clause };
  }
  // The Nth-most-recent flight defines when we drop below the threshold.
  const nth = qualifying[rule.minFlights - 1]!;
  const lapsesAt = new Date(nth.occurredAt.getTime() + rule.windowDays * DAY_MS);
  const status: CurrencyStatus =
    daysBetween(now, lapsesAt) <= rule.expiringWithinDays ? "expiring" : "current";
  return { status, count: qualifying.length, lapsesAt, clause: rule.clause };
}

/**
 * Single-event recency gate (e.g. KSA §107.71 knowledge recency, 24 months). The
 * most recent matching event must be within `months`; alert windows apply to the
 * computed expiry just like a credential.
 */
export function knowledgeRecencyCurrency(
  events: readonly RecencyEvent[],
  rule: { months: number; clause: string; eventType: string },
  now: Date,
  windows: readonly number[] = CREDENTIAL_ALERT_WINDOWS_DAYS,
): RecencyCurrency {
  const latest = events
    .filter((e) => e.eventType === rule.eventType && e.occurredAt <= now)
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())[0];
  if (!latest) return { status: "lapsed", lapsesAt: null, clause: rule.clause };
  const expiresAt = addMonthsUTC(latest.occurredAt, rule.months);
  const days = daysBetween(now, expiresAt);
  if (days < 0) return { status: "lapsed", lapsesAt: expiresAt, clause: rule.clause };
  const hit = [...windows].sort((a, b) => a - b).find((w) => days <= w) ?? null;
  return { status: hit !== null ? "expiring" : "current", lapsesAt: expiresAt, clause: rule.clause };
}

// ─────────────────────────────────────────────────────────── fit-to-fly
/** Why a check is not current — drives the action shown (obtain vs renew). */
export type ReasonKind = "missing" | "unverified" | "expired" | "expiring" | "stale";

export interface ReadinessCheck {
  key: string;
  label: string;
  status: CurrencyStatus;
  clause?: string;
  detail?: string;
  reasonKind?: ReasonKind;
}

export type Verdict = "fit" | "caution" | "not-fit" | "unknown";

export interface ReadinessVerdict {
  jurisdiction: Jurisdiction;
  airframeClass: string;
  verdict: Verdict;
  /**
   * Whether this verdict blocks mission assignment. BOTH "not-fit" and "unknown"
   * block flight — the difference is only the reason (expired → renew; missing →
   * obtain/verify). "unknown" must never read as a soft pass. Overridable only
   * via the logged override path, never silently.
   */
  blocksAssignment: boolean;
  checks: ReadinessCheck[];
  /** Human-readable reasons the person is not "fit" (blocking + caution). */
  reasons: string[];
}

const STATUS_RANK: Record<CurrencyStatus, number> = {
  lapsed: 3,
  unverified: 2,
  expiring: 1,
  current: 0,
};

function rollUp(checks: readonly ReadinessCheck[]): Verdict {
  if (checks.length === 0) return "unknown";
  const worst = Math.max(...checks.map((c) => STATUS_RANK[c.status]));
  if (worst === 3) return "not-fit";
  if (worst === 2) return "unknown";
  if (worst === 1) return "caution";
  return "fit";
}

export interface FitToFlyInput {
  credentials: readonly CredentialInput[];
  recencyEvents: readonly RecencyEvent[];
  /** Effective operator recency rule (org override or the content default). */
  operatorRecencyRule?: OperatorRecencyRule;
}

/**
 * Fit-to-fly verdict for a person on one airframe class under one jurisdiction.
 * Resolves the jurisdiction's required wallet credentials + recency checks from
 * content, evaluates each, and rolls up to a verdict. A missing required
 * credential is `unverified` (we cannot confirm it), an expired/lapsed one is
 * `lapsed` — both block, but the reason distinguishes them.
 */
export function fitToFly(
  jurisdiction: Jurisdiction,
  airframeClass: string,
  input: FitToFlyInput,
  now: Date,
): ReadinessVerdict {
  const req = CURRENCY_REQUIREMENTS[jurisdiction];
  const checks: ReadinessCheck[] = [];
  const rule = input.operatorRecencyRule ?? OPERATOR_RECENCY_DEFAULT;

  if (req) {
    const held = new Map(input.credentials.map((c) => [c.kind, c]));
    for (const kindCode of req.credentials) {
      const kind = getCredentialKind(kindCode);
      const label = kind?.label ?? kindCode;
      const clause = kind?.clause ?? MEDICAL_GATES[jurisdiction]?.clause;
      const held1 = held.get(kindCode);
      if (!held1) {
        checks.push({
          key: `credential:${kindCode}`,
          label,
          status: "unverified",
          clause,
          detail: "Not on file",
          reasonKind: "missing",
        });
        continue;
      }
      const cur = credentialCurrency(held1, now);
      const reasonKind: ReasonKind | undefined =
        cur.status === "lapsed"
          ? "expired"
          : cur.status === "expiring"
            ? "expiring"
            : cur.status === "unverified"
              ? "unverified"
              : undefined;
      checks.push({
        key: `credential:${kindCode}`,
        label,
        status: cur.status,
        clause,
        reasonKind,
        detail:
          cur.daysUntilExpiry == null
            ? undefined
            : cur.daysUntilExpiry < 0
              ? `Expired ${-cur.daysUntilExpiry} d ago`
              : `${cur.daysUntilExpiry} d to expiry`,
      });
    }

    for (const recencyKey of req.recency) {
      if (recencyKey === "operator") {
        const cur = operatorRecencyCurrency(input.recencyEvents, airframeClass, now, rule);
        checks.push({
          key: "recency:operator",
          label: `Operator recency (${rule.minFlights}/${rule.windowDays} d)`,
          status: cur.status,
          clause: cur.clause,
          reasonKind: cur.status === "lapsed" ? "stale" : cur.status === "expiring" ? "expiring" : undefined,
          detail: `${cur.count ?? 0}/${rule.minFlights} flights in ${rule.windowDays} d`,
        });
      } else {
        const gate = KNOWLEDGE_RECENCY_GATES[jurisdiction];
        if (gate && gate.eventType === recencyKey) {
          const cur = knowledgeRecencyCurrency(input.recencyEvents, gate, now);
          checks.push({
            key: `recency:${recencyKey}`,
            label: "Knowledge recency",
            status: cur.status,
            clause: cur.clause,
            reasonKind: cur.status === "lapsed" ? "stale" : cur.status === "expiring" ? "expiring" : undefined,
            detail: cur.lapsesAt ? `valid to ${cur.lapsesAt.toISOString().slice(0, 10)}` : "no record",
          });
        }
      }
    }
  }

  const verdict = rollUp(checks);
  const reasons = checks
    .filter((c) => c.status !== "current")
    .map((c) => `${c.label}: ${c.status}${c.clause ? ` (${c.clause})` : ""}`);
  return {
    jurisdiction,
    airframeClass,
    verdict,
    blocksAssignment: verdict === "not-fit" || verdict === "unknown",
    checks,
    reasons,
  };
}
