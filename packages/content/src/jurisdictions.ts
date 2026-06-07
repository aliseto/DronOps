import { z } from "zod";

/**
 * Jurisdiction enablement vocabulary (DRO-REG-001 §2). This is CONTENT, not
 * app logic: org settings enable these frameworks; each governed record later
 * binds exactly one. Deadlines/retention/gates are derived from content rules
 * (PR-010.5), never hardcoded in app code.
 */
export const JURISDICTION_KEYS = ["UAE-Federal", "UAE-Dubai", "KSA", "Oman", "ISO"] as const;
export type JurisdictionKey = (typeof JURISDICTION_KEYS)[number];

export interface JurisdictionDef {
  key: JurisdictionKey;
  label: string;
  authority: string;
  kind: "regulator" | "standard";
  summary: string;
}

export const JURISDICTIONS: Record<JurisdictionKey, JurisdictionDef> = {
  "UAE-Federal": {
    key: "UAE-Federal",
    label: "UAE — Federal",
    authority: "GCAA · CAR-UAC",
    kind: "regulator",
    summary: "Federal UAE operations: 3-hour accident clock, GCAA CAPA defaults, UOA validity.",
  },
  "UAE-Dubai": {
    key: "UAE-Dubai",
    label: "UAE — Dubai",
    authority: "DCAA · DCAR-UAS / DUOSAM",
    kind: "regulator",
    summary: "Dubai operations: 72-hour occurrence clock, pilot sign-off, duty/rest, DUOSAM OM.",
  },
  KSA: {
    key: "KSA",
    label: "Saudi Arabia",
    authority: "GACA · GACAR 107/48 · AC 107-01",
    kind: "regulator",
    summary: "KSA operations: 10-day clock, §107.71 recency gate, Part 48 registration expiry.",
  },
  Oman: {
    key: "Oman",
    label: "Oman",
    authority: "CAA · CAR-102 / CAR-47 · AWR 033",
    kind: "regulator",
    summary:
      "Oman operations: green-zone approval (Serb platform), immediate + 3-day occurrence reporting, 122 m ceiling, AWR 033 permit.",
  },
  ISO: {
    key: "ISO",
    label: "ISO 9001:2015",
    authority: "ISO 9001:2015",
    kind: "standard",
    summary: "QMS: documented information, operational control, audit, management review.",
  },
};

export const isJurisdictionKey = (v: string): v is JurisdictionKey =>
  (JURISDICTION_KEYS as readonly string[]).includes(v);

/**
 * A mission binds exactly ONE operative regulator layer (Hard Rule 3) — never a
 * `standard` like ISO (management_system, never mission-gated). For a UAE tenant
 * this yields GCAA-federal + DCAA-Dubai (the per-mission federal-vs-emirate
 * choice); for a single-regulator tenant it collapses to one. Coverage, by
 * contrast, spans ALL enabled frameworks (incl. ISO).
 */
export const isRegulator = (key: string): boolean =>
  isJurisdictionKey(key) && JURISDICTIONS[key].kind === "regulator";

/** The mission-bindable regulator layers among the org's enabled frameworks. */
export const missionBindableJurisdictions = (enabled: readonly string[]): string[] =>
  enabled.filter(isRegulator);

export interface JurisdictionAdvisory {
  level: "advisory";
  message: string;
}

/**
 * Cross-jurisdiction advisories (NOT blocks). DRO-REG-001 §1.2: a Dubai
 * operator almost always also carries the federal GCAA obligation, so enabling
 * UAE-Dubai without UAE-Federal surfaces an advisory to enable Federal too.
 */
export function jurisdictionAdvisories(enabled: readonly string[]): JurisdictionAdvisory[] {
  const set = new Set(enabled);
  const out: JurisdictionAdvisory[] = [];
  if (set.has("UAE-Dubai") && !set.has("UAE-Federal")) {
    out.push({
      level: "advisory",
      message:
        "Most Dubai operators also carry the federal GCAA obligation (CAR-UAC). Consider enabling UAE — Federal as well.",
    });
  }
  return out;
}

// Validation guard used by tests: ensure the record covers every key.
export const jurisdictionsSchema = z.record(
  z.enum(JURISDICTION_KEYS),
  z.object({
    key: z.enum(JURISDICTION_KEYS),
    label: z.string(),
    authority: z.string(),
    kind: z.enum(["regulator", "standard"]),
    summary: z.string(),
  }),
);
