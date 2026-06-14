/**
 * M3 Safety — SORA OSO robustness assignment (the PR-034 follow-up).
 * JARUS SORA 2.0 Main Body (JAR-DEL-WG6-D.04, 2019) Table 6 — "Recommended
 * operational safety objectives (OSO)": 24 OSOs × SAIL I–VI recommended
 * robustness. Encoded verbatim as a single source of truth; SORA 2.5
 * (JAR_doc_25 Table 14) restructures this list — do NOT mix versions.
 *
 * Levels: O = optional · L/M/H = recommended with low/medium/high robustness.
 * Verified against three independent transcriptions of Table 6 / EASA AMC1
 * Article 11 Table 6 (cell-level agreement; one source's OSO#06 row was a
 * known one-column shift and was rejected). Primary PDF:
 * jarus-rpas.org → jar_doc_06_jarus_sora_v2.0.pdf, Table 6 (p. 29).
 */

export type OsoLevel = "optional" | "low" | "medium" | "high";

export type OsoGroup = "technical" | "external" | "human" | "adverse";

export const OSO_GROUP_LABELS: Record<OsoGroup, string> = {
  technical: "Technical issue with the UAS",
  external: "Deterioration of external systems supporting UAS operation",
  human: "Human error",
  adverse: "Adverse operating conditions",
};

const LEVEL_BY_CHAR: Record<string, OsoLevel> = {
  O: "optional",
  L: "low",
  M: "medium",
  H: "high",
};

export interface OsoDefinition {
  no: number;
  title: string;
  group: OsoGroup;
  /** Robustness at SAIL I…VI as six chars of O/L/M/H (Table 6 row, verbatim). */
  sail: string;
}

export const OSOS: readonly OsoDefinition[] = [
  // Technical issue with the UAS
  { no: 1, group: "technical", title: "Ensure the operator is competent and/or proven", sail: "OLMHHH" },
  { no: 2, group: "technical", title: "UAS manufactured by competent and/or proven entity", sail: "OOLMHH" },
  { no: 3, group: "technical", title: "UAS maintained by competent and/or proven entity", sail: "LLMMHH" },
  { no: 4, group: "technical", title: "UAS developed to authority recognized design standards", sail: "OOOLMH" },
  { no: 5, group: "technical", title: "UAS is designed considering system safety and reliability", sail: "OOLMHH" },
  { no: 6, group: "technical", title: "C3 link performance is appropriate for the operation", sail: "OLLMHH" },
  { no: 7, group: "technical", title: "Inspection of the UAS (product inspection) to ensure consistency to the ConOps", sail: "LLMMHH" },
  { no: 8, group: "technical", title: "Operational procedures are defined, validated and adhered to", sail: "LMHHHH" },
  { no: 9, group: "technical", title: "Remote crew trained and current and able to control the abnormal situation", sail: "LLMMHH" },
  { no: 10, group: "technical", title: "Safe recovery from technical issue", sail: "LLMMHH" },
  // Deterioration of external systems supporting UAS operation
  { no: 11, group: "external", title: "Procedures are in-place to handle the deterioration of external systems supporting UAS operation", sail: "LMHHHH" },
  { no: 12, group: "external", title: "The UAS is designed to manage the deterioration of external systems supporting UAS operation", sail: "LLMMHH" },
  { no: 13, group: "external", title: "External services supporting UAS operations are adequate to the operation", sail: "LLMHHH" },
  // Human error
  { no: 14, group: "human", title: "Operational procedures are defined, validated and adhered to", sail: "LMHHHH" },
  { no: 15, group: "human", title: "Remote crew trained and current and able to control the abnormal situation", sail: "LLMMHH" },
  { no: 16, group: "human", title: "Multi crew coordination", sail: "LLMMHH" },
  { no: 17, group: "human", title: "Remote crew is fit to operate", sail: "LLMMHH" },
  { no: 18, group: "human", title: "Automatic protection of the flight envelope from Human Error", sail: "OOLMHH" },
  { no: 19, group: "human", title: "Safe recovery from Human Error", sail: "OOLMMH" },
  { no: 20, group: "human", title: "A Human Factors evaluation has been performed and the HMI found appropriate for the mission", sail: "OLLMMH" },
  // Adverse operating conditions
  { no: 21, group: "adverse", title: "Operational procedures are defined, validated and adhered to", sail: "LMHHHH" },
  { no: 22, group: "adverse", title: "The remote crew is trained to identify critical environmental conditions and to avoid them", sail: "LLMMMH" },
  { no: 23, group: "adverse", title: "Environmental conditions for safe operations defined, measurable and adhered to", sail: "LLMMHH" },
  { no: 24, group: "adverse", title: "UAS designed and qualified for adverse environmental conditions", sail: "OOMHHH" },
];

export interface OsoRequirement {
  no: number;
  title: string;
  group: OsoGroup;
  level: OsoLevel;
}

/** Robustness of one OSO at a SAIL (1–6). */
export function osoLevelAt(oso: OsoDefinition, sail: number): OsoLevel {
  const ch = oso.sail[sail - 1];
  const level = ch ? LEVEL_BY_CHAR[ch] : undefined;
  if (!level) throw new Error(`SAIL ${sail} is outside I–VI`);
  return level;
}

/** The 24 Table-6 requirements at a SAIL (1–6); empty when out of SORA (sail 0). */
export function osoRequirements(sail: number): OsoRequirement[] {
  if (sail < 1 || sail > 6) return [];
  return OSOS.map((o) => ({ no: o.no, title: o.title, group: o.group, level: osoLevelAt(o, sail) }));
}
