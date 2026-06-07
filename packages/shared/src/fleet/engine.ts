import { REGISTRATION_GATES, type RegistrationRule } from "@dronops/content";
import type { Jurisdiction } from "../jurisdiction/engine";

/**
 * Fleet engine (M5) — pure functions over an aircraft + content registration
 * rules. No regulator value embedded: the renewal window comes from
 * REGISTRATION_GATES per jurisdiction (e.g. GACA Part 48 = 6 months). The
 * resulting status maps to StatusPill's `asset` vocabulary.
 */

const DAY_MS = 86_400_000;

/** Mirrors StatusPill `asset`. */
export type AssetStatus = "operational" | "due-soon" | "in-maintenance" | "grounded";

export type RegistrationStatus = "current" | "expiring" | "lapsed" | "none";

export interface RegistrationCurrency {
  status: RegistrationStatus;
  expiresAt: Date | null;
  daysUntilExpiry: number | null;
  rule?: RegistrationRule;
}

/**
 * Registration currency for an aircraft. Window = the jurisdiction's renewal
 * window (REGISTRATION_GATES) when defined, else a 60-day default. `none` when no
 * expiry is tracked (registration not expiry-gated in that jurisdiction).
 */
export function registrationCurrency(
  input: { registrationExpiresAt: Date | null; registrationJurisdiction?: string | null },
  now: Date,
  defaultWindowDays = 60,
): RegistrationCurrency {
  if (!input.registrationExpiresAt) return { status: "none", expiresAt: null, daysUntilExpiry: null };
  const rule = input.registrationJurisdiction
    ? REGISTRATION_GATES[input.registrationJurisdiction as Jurisdiction]
    : undefined;
  const windowDays = rule ? rule.renewalWindowMonths * 30 : defaultWindowDays;
  const days = Math.floor((input.registrationExpiresAt.getTime() - now.getTime()) / DAY_MS);
  const status: RegistrationStatus = days < 0 ? "lapsed" : days <= windowDays ? "expiring" : "current";
  return { status, expiresAt: input.registrationExpiresAt, daysUntilExpiry: days, rule };
}

export interface AssetStatusResult {
  status: AssetStatus;
  registration: RegistrationCurrency;
}

/**
 * Overall asset status. Precedence: grounded (manual OR lapsed registration —
 * can't legally fly) → in-maintenance → due-soon (registration in renewal
 * window) → operational. Registration that isn't expiry-tracked never forces
 * due-soon/grounded.
 */
export function assetStatus(
  input: {
    condition: "operational" | "in_maintenance" | "grounded";
    registrationExpiresAt: Date | null;
    registrationJurisdiction?: string | null;
  },
  now: Date,
): AssetStatusResult {
  const registration = registrationCurrency(input, now);
  let status: AssetStatus;
  if (input.condition === "grounded" || registration.status === "lapsed") status = "grounded";
  else if (input.condition === "in_maintenance") status = "in-maintenance";
  else if (registration.status === "expiring") status = "due-soon";
  else status = "operational";
  return { status, registration };
}
