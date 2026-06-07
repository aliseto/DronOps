/**
 * Manual-suite preload content (PR-015): the parameter schema that templatizes
 * the Aironov AIR- suite per operator, the preload manifest, the form-template
 * seeds, and section-stub bodies with {{group.key}} variables. Verbatim bodies
 * arrive as a later content commit; this is the stub-first pipeline (spec §6 +
 * amendments v1.1).
 */

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
      { key: "email", label: "Email", type: "text", required: true },
      { key: "phone", label: "Phone", type: "text" },
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
  { code: "CHANGEREQ-01", title: "Change request", appliesTo: "generic" },
  { code: "IMPROVEMENT-01", title: "Improvement suggestion", appliesTo: "generic" },
];

/**
 * Section-stub bodies with {{group.key}} variables and [[juris:KEY]]…[[/juris]]
 * jurisdiction blocks (rendered only for enabled jurisdictions). Verbatim text
 * lands in the later content commit; these stubs exercise the pipeline.
 */
export const STUB_BODIES: Record<string, string> = {
  "MAN-001": `# Standards & Operations Manual — {{organization.legal_name}} ({{organization.trade_name}})
§1 Organization: {{organization.registered_address}}, {{organization.hq_city_country}}.
§2 Postholders: Accountable Manager {{postholders.accountable_manager}}; Quality Manager {{postholders.quality_manager}}; Operations Manager {{postholders.operations_manager}}.
§6 Records control — retention {{thresholds.records_retention_months}} months (platform rule).
§20 Competence & pilot currency — recency: ≥{{thresholds.recency_min_flights}} flights in {{thresholds.recency_window_days}} days on the airframe class.
§23 Financial controls & approval authority — see approval matrix.
§26 Insurance & legal register — liability limit {{thresholds.insurance_liability_limit}}. The live register lives in DronOps (External documents + credentials + aircraft registrations).
Appendix C — Document & forms register: forms are platform modules (see Forms).`,
  "MAN-002": `# Flight Operations Manual — {{organization.trade_name}}
Ch.1 Scope & regulatory alignment.
[[juris:UAE-Federal]]Ch.1.2 GCAA (CAR-UAC) operations.[[/juris]]
[[juris:UAE-Dubai]]Ch.1.2 DCAA (DCAR-UAS / DUOSAM) operations.[[/juris]]
[[juris:KSA]]Ch.1.2 GACA (GACAR 107) operations.[[/juris]]
[[juris:IDN]]Ch.1.2 DGCA (PM 37/2020) operations.[[/juris]]
Ch.2 Crew — Visual Observer and stop-work authority are universal.`,
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

const JURIS_BLOCK = /\[\[juris:([A-Za-z-]+)\]\]([\s\S]*?)\[\[\/juris\]\]/g;

/** Render a stub body: strip disabled jurisdiction blocks, substitute variables. */
export function renderManualBody(
  body: string,
  params: Record<string, Record<string, unknown>>,
  enabledJurisdictions: readonly string[],
): { rendered: string; missing: string[] } {
  const missing: string[] = [];
  const withJuris = body.replace(JURIS_BLOCK, (_m, key: string, inner: string) =>
    enabledJurisdictions.includes(key) ? inner : "",
  );
  const rendered = withJuris.replace(/\{\{([\w]+)\.([\w]+)\}\}/g, (_m, group: string, key: string) => {
    const v = params[group]?.[key];
    if (v == null || v === "") {
      missing.push(`${group}.${key}`);
      return `{{${group}.${key}}}`;
    }
    return String(v);
  });
  return { rendered, missing: [...new Set(missing)] };
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
