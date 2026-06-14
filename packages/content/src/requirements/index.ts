import { caruac } from "./caruac";
import { dcar } from "./dcar";
import { gacar107 } from "./gacar107";
import { gacar48 } from "./gacar48";
import { ac10701 } from "./ac10701";
import { car102 } from "./car102";
import { car47 } from "./car47";
import { awr033 } from "./awr033";
import { iso9001 } from "./iso9001";
import { requirementSchema, type RequirementDef } from "./types";

// Expected derivation per framework (kind + jurisdiction). Asserted at load so
// a bad regeneration can't ship silently.
const DERIVATION: Record<string, { kind: RequirementDef["kind"]; jurisdiction: string }> = {
  "CAR-UAC": { kind: "regulation", jurisdiction: "UAE-Federal" },
  "DCAR-UAS": { kind: "regulation", jurisdiction: "UAE-Dubai" },
  "GACAR Part 107": { kind: "regulation", jurisdiction: "KSA" },
  "GACAR Part 48": { kind: "regulation", jurisdiction: "KSA" },
  "GACA AC 107-01": { kind: "guidance", jurisdiction: "KSA" },
  "CAR-102": { kind: "regulation", jurisdiction: "Oman" },
  "CAR-47": { kind: "regulation", jurisdiction: "Oman" },
  "CAA AWR 033": { kind: "guidance", jurisdiction: "Oman" },
  "ISO 9001": { kind: "standard", jurisdiction: "ISO" },
};

function load(): RequirementDef[] {
  const all = [...caruac, ...dcar, ...gacar107, ...gacar48, ...ac10701, ...car102, ...car47, ...awr033, ...iso9001];
  const seen = new Set<string>();
  for (const r of all) {
    requirementSchema.parse(r); // shape + record-type vocabulary
    if (seen.has(r.id)) throw new Error(`Duplicate requirement id: ${r.id}`);
    seen.add(r.id);
    const rule = DERIVATION[r.framework];
    if (!rule) throw new Error(`No derivation rule for framework: ${r.framework}`);
    if (r.kind !== rule.kind || r.jurisdiction !== rule.jurisdiction) {
      throw new Error(`Derivation mismatch for ${r.id} (${r.framework})`);
    }
  }
  return all;
}

/** All requirement definitions, validated at module load. */
export const REQUIREMENTS: readonly RequirementDef[] = load();

const byId = new Map(REQUIREMENTS.map((r) => [r.id, r]));

export function getRequirement(id: string): RequirementDef | undefined {
  return byId.get(id);
}

export function requirementsByJurisdiction(jurisdiction: string): RequirementDef[] {
  return REQUIREMENTS.filter((r) => r.jurisdiction === jurisdiction);
}

export function requirementsByFramework(framework: string): RequirementDef[] {
  return REQUIREMENTS.filter((r) => r.framework === framework);
}

export function requirementsByRiskTier(riskTier: RequirementDef["riskTier"]): RequirementDef[] {
  return REQUIREMENTS.filter((r) => r.riskTier === riskTier);
}

export {
  type RequirementDef,
  type RecordType,
  RECORD_TYPES,
  type RiskTier,
  RISK_TIERS,
} from "./types";
