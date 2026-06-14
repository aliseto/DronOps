/**
 * Manual-suite preload content (PR-015): the parameter schema that templatizes
 * the Aironov AIR- suite per operator, the preload manifest, the form-template
 * seeds, and section-stub bodies with {{group.key}} variables. Verbatim bodies
 * amendments v1.1). Verbatim AIR-MAN-001/002 bodies landed via the content drop.
 */

import { man001 } from "./manual-suite/bodies/man001";
import { man002 } from "./manual-suite/bodies/man002";

export type ParamFieldType =
  | "text"
  | "number"
  | "money"
  | "date"
  | "bool"
  | "person" // RBAC-bound postholder (person picker)
  | "multiselect"
  | "rows"; // structured rows (bid bands, matrices) — captured as JSON for now

export interface ParamField {
  key: string;
  label: string;
  type: ParamFieldType;
  /** RBAC-bound postholder field → person must hold this domain role. */
  rbacRole?: string;
  /** text-only postholder (no platform role). */
  textOnly?: boolean;
  options?: { value: string; label: string }[];
  default?: unknown;
  required?: boolean;
  help?: string;
}
export interface ParamGroup {
  id: string;
  label: string;
  fields: ParamField[];
}

const SERVICE_LINES = ["mapping", "inspection", "solar_pv", "autonomous_dock", "consulting", "training"];
const OPS_TYPES = ["VLOS", "EVLOS", "BVLOS", "night", "over_people", "dock"];

/** Parameter schema (spec §2 + amendments B1–B4). Drives the wizard. */
export const PARAM_GROUPS: ParamGroup[] = [
  {
    id: "organization",
    label: "Organization",
    fields: [
      { key: "legal_name", label: "Legal name", type: "text", required: true },
      { key: "trade_name", label: "Trade name", type: "text", required: true },
      { key: "registered_address", label: "Registered address", type: "text", required: true },
      { key: "hq_city_country", label: "HQ city, country", type: "text", required: true },
      { key: "operating_geography", label: "Operating geography", type: "text", default: "GCC + Indonesia" },
      { key: "headcount_band", label: "Headcount band", type: "text", default: "6–15" },
      { key: "doc_prefix", label: "Document prefix", type: "text", default: "AIR" },
      { key: "email", label: "Email", type: "text", required: true },
      { key: "phone", label: "Phone", type: "text" },
    ],
  },
  {
    id: "jurisdictions",
    label: "Jurisdictions",
    fields: [
      {
        key: "active_display",
        label: "Active authorities (cover line)",
        type: "text",
        default: "GCAA · DCAA · GACA · CAA Oman",
      },
    ],
  },
  {
    id: "roles",
    label: "Role titles",
    fields: [
      { key: "accountable_manager_title", label: "Accountable manager title", type: "text", default: "Managing Director" },
      { key: "ops_manager_title", label: "Operations manager title", type: "text", default: "Operations Manager" },
      { key: "quality_lead_title", label: "Quality lead title", type: "text", default: "Quality & Compliance Lead" },
      { key: "chief_pilot_title", label: "Chief pilot title", type: "text", default: "Chief Pilot" },
      { key: "finance_lead_title", label: "Finance lead title", type: "text", default: "Finance Lead" },
      { key: "commercial_lead_title", label: "Commercial lead title", type: "text", default: "Commercial Lead" },
      { key: "project_manager_title", label: "Project manager title", type: "text", default: "Project Manager" },
    ],
  },
  {
    id: "postholders",
    label: "Postholders",
    fields: [
      // RBAC-bound (require person_roles)
      { key: "accountable_manager", label: "Accountable manager", type: "person", rbacRole: "accountable_manager", required: true },
      { key: "quality_manager", label: "Quality manager", type: "person", rbacRole: "quality_manager", required: true },
      { key: "operations_manager", label: "Operations manager", type: "person", rbacRole: "ops_manager", required: true },
      // text-only (amendment B4) — no platform role
      { key: "commercial_lead", label: "Commercial lead", type: "text", textOnly: true },
      { key: "finance_lead", label: "Finance lead", type: "text", textOnly: true },
      { key: "it_custodian", label: "IT custodian", type: "text", textOnly: true },
    ],
  },
  {
    id: "fleet_scope",
    label: "Fleet & scope",
    fields: [
      {
        key: "service_lines",
        label: "Service lines",
        type: "multiselect",
        options: SERVICE_LINES.map((s) => ({ value: s, label: s })),
      },
      {
        key: "ops_types",
        label: "Operation types",
        type: "multiselect",
        options: OPS_TYPES.map((s) => ({ value: s, label: s })),
      },
    ],
  },
  {
    id: "thresholds",
    label: "Thresholds",
    fields: [
      // amendment B3 — structured recency rule (seeds the currency engine + §20)
      { key: "recency_min_flights", label: "Recency: min flights", type: "number", default: 3 },
      { key: "recency_window_days", label: "Recency: window (days)", type: "number", default: 90 },
      { key: "annual_hours", label: "Annual flying hours minimum", type: "number", default: 20 },
      // amendment B2 — §23 financial approval matrix band edges (AED), values editable
      { key: "fin_b1_max", label: "Approval band 1 max (AED)", type: "number", default: 5000 },
      { key: "fin_b1_max_plus", label: "Approval band 2 start (AED)", type: "number", default: 5001 },
      { key: "fin_b2_max", label: "Approval band 2 max (AED)", type: "number", default: 25000 },
      { key: "fin_b2_max_plus", label: "Approval band 3 start (AED)", type: "number", default: 25001 },
      { key: "fin_b3_max", label: "Approval band 3 max (AED)", type: "number", default: 100000 },
      { key: "fin_b3_max_plus", label: "Approval band 4 start (AED)", type: "number", default: 100001 },
      { key: "fin_b4_max", label: "Approval band 4 max (AED)", type: "number", default: 500000 },
      { key: "insurance_liability_limit", label: "Insurance liability limit", type: "money", required: true },
      // amendment B1 — bid bands (structure fixed, values editable)
      {
        key: "bid_bands",
        label: "Bid/no-bid bands (AED)",
        type: "rows",
        default: [
          { band_min: 0, band_max: 150000, approver_role: "ops_manager" },
          { band_min: 150001, band_max: 500000, approver_role: "ops_manager" },
          { band_min: 500001, band_max: 2000000, approver_role: "accountable_manager" },
          { band_min: 2000001, band_max: null, approver_role: "accountable_manager" },
        ],
      },
      { key: "records_retention_months", label: "Records retention (months)", type: "number", default: 36, help: "Locked platform rule — display only." },
    ],
  },
  {
    id: "numbering_carryin",
    label: "Numbering",
    fields: [
      { key: "keep_legacy_numbers", label: "Keep legacy numbers (AIR-MAN-001…)", type: "bool", default: true },
      { key: "legacy_prefix", label: "Legacy prefix", type: "text", default: "AIR" },
    ],
  },
];

export type ManifestCategory = "manual" | "policy" | "procedure";

export interface ManifestDoc {
  /** source code, also the stub-body key */
  source: string;
  number: string; // platform number
  legacyNumber: string;
  category: ManifestCategory;
  title: string;
  ownerRole: string;
  /** only preload when this scope predicate passes */
  requiresServiceLine?: string;
  requiresOpsType?: string;
}

/** Preload manifest (spec §3). Conditional rows are skipped (not hidden). */
export const DOC_MANIFEST: ManifestDoc[] = [
  { source: "MAN-001", number: "MAN-001", legacyNumber: "AIR-MAN-001", category: "manual", title: "Standards & Operations Manual", ownerRole: "accountable_manager" },
  { source: "MAN-002", number: "MAN-002", legacyNumber: "AIR-MAN-002", category: "manual", title: "Flight Operations Manual", ownerRole: "ops_manager" },
  { source: "POL-001", number: "POL-001", legacyNumber: "AIR-POL-001", category: "policy", title: "Quality Policy", ownerRole: "accountable_manager" },
  { source: "POL-002", number: "POL-002", legacyNumber: "AIR-POL-002", category: "policy", title: "QHSE Policy & Code of Conduct", ownerRole: "accountable_manager" },
  { source: "POL-003", number: "POL-003", legacyNumber: "AIR-POL-003", category: "policy", title: "IT Acceptable Use", ownerRole: "quality_manager" },
  { source: "POL-004", number: "POL-004", legacyNumber: "AIR-POL-004", category: "policy", title: "Data Protection", ownerRole: "accountable_manager" },
  { source: "POL-005", number: "POL-005", legacyNumber: "AIR-POL-005", category: "policy", title: "Standard Commercial Terms", ownerRole: "accountable_manager" },
  { source: "SOP-001", number: "SOP-001", legacyNumber: "AIR-SOP-001", category: "procedure", title: "Standard Flight Operations", ownerRole: "ops_manager" },
  { source: "SOP-002", number: "SOP-002", legacyNumber: "AIR-SOP-002", category: "procedure", title: "Autonomous Operations", ownerRole: "ops_manager", requiresOpsType: "dock" },
  { source: "SOP-007", number: "SOP-007", legacyNumber: "AIR-SOP-007", category: "procedure", title: "Solar PV Inspection (IEC 62446-3)", ownerRole: "ops_manager", requiresServiceLine: "solar_pv" },
  { source: "SOP-013", number: "SOP-013", legacyNumber: "AIR-SOP-013", category: "procedure", title: "Sales & Tendering", ownerRole: "accountable_manager" },
  { source: "SOP-014", number: "SOP-014", legacyNumber: "AIR-SOP-014", category: "procedure", title: "Contract Review", ownerRole: "accountable_manager" },
];

/** Forms map to platform form_templates, NOT documents (spec §4). */
export interface ManifestForm {
  code: string;
  title: string;
  appliesTo: "generic" | "mission_preflight" | "postflight" | "risk_assessment";
}
export const FORM_MANIFEST: ManifestForm[] = [
  { code: "PREFLIGHT-01", title: "Pre-flight checklist", appliesTo: "mission_preflight" },
  { code: "POSTFLIGHT-01", title: "Post-flight report", appliesTo: "postflight" },
  { code: "JSA-01", title: "Job safety analysis", appliesTo: "risk_assessment" },
  { code: "BIDNOBID-01", title: "Bid / no-bid", appliesTo: "generic" },
  { code: "CHANGEREQ-01", title: "Project change request", appliesTo: "generic" },
];

/**
 * Document bodies. MAN-001/002 are the verbatim owner-supplied templates
 * (content drop). The remaining POL/SOP are section stubs until their verbatim
 * bodies land. {{group.key}} variables, [[jurisdiction:KEYS]]…[[/jurisdiction]]
 * conditional blocks (KEYS '+'-separated; 'UAE' = Federal+Dubai), and
 * [[param:…]]…[[/param]] configurable-default wrappers.
 */
export const STUB_BODIES: Record<string, string> = {
  "MAN-001": man001,
  "MAN-002": man002,
  "POL-001": `# Quality Policy — {{organization.legal_name}}. Signed: {{postholders.accountable_manager}}.`,
  "POL-002": `# QHSE Policy & Code of Conduct — {{organization.legal_name}}.`,
  "POL-003": `# IT Acceptable Use — custodian {{postholders.it_custodian}}.`,
  "POL-004": `# Data Protection — {{organization.legal_name}}.`,
  "POL-005": `# Standard Commercial Terms — {{postholders.commercial_lead}}.`,
  "SOP-001": `# Standard Flight Operations — owner {{postholders.operations_manager}}.`,
  "SOP-002": `# Autonomous Operations (dock).`,
  "SOP-007": `# Solar PV Inspection (IEC 62446-3).`,
  "SOP-013": `# Sales & Tendering — bid/no-bid bands apply.`,
  "SOP-014": `# Contract Review — finance lead {{postholders.finance_lead}}.`,
};

const COMMENT = /<!--[\s\S]*?-->/g;
const JURIS_BLOCK = /\[\[jurisdiction:([^\]]+)\]\]([\s\S]*?)\[\[\/jurisdiction\]\]/g;
const PARAM_BLOCK = /\[\[param:[^\]]*\]\]([\s\S]*?)\[\[\/param\]\]/g;

/** A jurisdiction block renders if ANY listed key is enabled. KEYS are
 * '+'-separated; the alias 'UAE' expands to UAE-Federal + UAE-Dubai. */
function jurisdictionEnabled(list: string, enabled: readonly string[]): boolean {
  return list
    .split("+")
    .flatMap((k) => (k.trim() === "UAE" ? ["UAE-Federal", "UAE-Dubai"] : [k.trim()]))
    .some((k) => enabled.includes(k));
}

/**
 * Render a document body: strip the templatization legend comment, drop disabled
 * jurisdiction blocks, unwrap [[param:…]] configurable defaults, then substitute
 * {{group.key}} variables (reporting any unresolved ones).
 */
export function renderManualBody(
  body: string,
  params: Record<string, Record<string, unknown>>,
  enabledJurisdictions: readonly string[],
): { rendered: string; missing: string[] } {
  const missing: string[] = [];
  const rendered = body
    .replace(COMMENT, "")
    .replace(JURIS_BLOCK, (_m, list: string, inner: string) =>
      jurisdictionEnabled(list, enabledJurisdictions) ? inner : "",
    )
    .replace(PARAM_BLOCK, (_m, inner: string) => inner)
    .replace(/\{\{(\w+)\.(\w+)\}\}/g, (_m, group: string, key: string) => {
      const v = params[group]?.[key];
      if (v == null || v === "") {
        missing.push(`${group}.${key}`);
        return `{{${group}.${key}}}`;
      }
      return String(v);
    });
  return { rendered, missing: [...new Set(missing)] };
}

/** Fill params with schema defaults for any key the operator hasn't set, so
 * defaulted role titles / thresholds resolve while truly-required fields block. */
export function applyParamDefaults(
  params: Record<string, Record<string, unknown>>,
): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  for (const g of PARAM_GROUPS) {
    out[g.id] = { ...(params[g.id] ?? {}) };
    for (const f of g.fields) {
      if (f.default !== undefined && (out[g.id]![f.key] == null || out[g.id]![f.key] === "")) {
        out[g.id]![f.key] = f.default;
      }
    }
  }
  // preserve any groups not in the schema
  for (const k of Object.keys(params)) if (!out[k]) out[k] = params[k]!;
  return out;
}

/** Manifest filtered by org scope (service lines / ops types). */
export function applicableDocs(params: Record<string, Record<string, unknown>>): ManifestDoc[] {
  const services = (params.fleet_scope?.service_lines as string[] | undefined) ?? [];
  const opsTypes = (params.fleet_scope?.ops_types as string[] | undefined) ?? [];
  return DOC_MANIFEST.filter((d) => {
    if (d.requiresServiceLine && !services.includes(d.requiresServiceLine)) return false;
    if (d.requiresOpsType && !opsTypes.includes(d.requiresOpsType)) return false;
    return true;
  });
}

export function manifestDocNumber(d: ManifestDoc, params: Record<string, Record<string, unknown>>): string {
  return params.numbering_carryin?.keep_legacy_numbers === false ? d.number : d.legacyNumber;
}
