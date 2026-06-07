import { z } from "zod";

/**
 * Jurisdiction enablement vocabulary (DRO-REG-001 §2). This is CONTENT, not
 * app logic: org settings enable these frameworks; each governed record later
 * binds exactly one. Deadlines/retention/gates are derived from content rules
 * (PR-010.5), never hardcoded in app code.
 */
export const JURISDICTION_KEYS = ["UAE-Federal", "UAE-Dubai", "KSA", "ISO"] as const;
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
