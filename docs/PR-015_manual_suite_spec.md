# PR-015 SPEC — Manual-suite preload: parameter schema & manifest

Source suite: Aironov AIR- document family (AIR-MAN-001 Standards & Operations
Manual, 8 parts; AIR-MAN-002 Flight Operations Manual, 10 chapters; policies;
SOPs; forms pack). This spec defines (1) the onboarding parameter schema that
templatizes the suite per operator, (2) the preload manifest mapping each
source document to a DronOps category/number, and (3) the platform-native
mapping rule for forms. Owner will supply the verbatim .docx files for
placeholder verification before content finalization — build the schema and
wizard against this spec now.

## 1. Template variable convention

`{{group.key}}` in document bodies; all variables typed below; the onboarding
wizard collects them in the group order; values stored per org
(org_template_params jsonb, audited); re-running the wizard re-renders DRAFT
revisions only (never touches approved revisions).

## 2. Parameter schema

### 2.1 organization (required)
| Key | Type | Example | Used in |
|---|---|---|---|
| legal_name | text | DronOps FZ LLC | covers, headers, §1 |
| trade_name | text | DronOps | display |
| entity_type_reg_no | text | FZ-LLC · 12345 | MAN-001 §1 |
| registered_address | text | Masdar City, Abu Dhabi | covers, ERP contacts |
| hq_city_country | text | Dubai, UAE | MAN-001 §1 |
| phone / email / website | text | — | covers, ERP |
| logo_file | file | — | print headers |

### 2.2 postholders (required — maps to person_roles)
Each: person picker (must hold the matching domain role) → name + title + email
rendered; wizard offers to create the person_roles assignment if missing.
| Key | Domain role | Used in |
|---|---|---|
| accountable_manager | accountable_manager | approval page, MAN-001 §2, FOM ch.1 |
| quality_manager | quality_manager | approval page, QMS sections |
| operations_manager | ops_manager | FOM throughout, SOP owners |
| chief_remote_pilot | ops_manager or pilot+flag | FOM crew chapters |
| qhse_lead | quality_manager (or ops) | JSA/incident ownership |
| document_controller | quality_manager default | MAN-001 §6 |

### 2.3 jurisdictions_authorizations (per enabled jurisdiction)
| Key | Type | Notes |
|---|---|---|
| authority_display | derived | GCAA / DCAA / GACA per org_jurisdictions |
| authorization_type | enum | UOA / Dubai OA+DUOSAM / GACA OA / UOC |
| authorization_ref | text | renders in FOM ch.2 regulatory alignment |
| authorization_issue / expiry | date | also creates the EXT document records |
| occurrence_contact | text | prefilled per DRO-REG-001 §6 (GCAA hotline/aai@; DCAA portal; GACA/NTSC); editable |

### 2.4 fleet_scope
| Key | Type | Used in |
|---|---|---|
| aircraft_types[] | picker from aircraft_types | FOM platform sections, MAN-001 scope |
| service_lines[] | multi: mapping, inspection, solar_pv (IEC 62446-3), autonomous_dock, consulting, training | MAN-001 scope §, SOP applicability |
| ops_types[] | multi: VLOS, EVLOS, BVLOS, night, over_people, dock | FOM specific-ops chapters incl/excl |

### 2.5 thresholds (the values flagged "needs owner decision" in the source build)
| Key | Type | Default | Used in |
|---|---|---|---|
| financial_approval_matrix | rows {role, limit_aed} | none — required | MAN-001 §21 |
| bid_nobid_threshold_aed | number | none — required | §14, FRM-013 |
| insurance_liability_limit | money+currency | none — required (broker-confirmed) | §24 + EXT insurance record |
| pilot_currency_days | int | 90 | §7.4 + currency engine note* |
| kpi_targets | rows {kpi, target} | template set | §33 + future KPI engine |
| records_retention_months | int | 36 (locked, display-only) | §6 — renders platform rule |

*pilot_currency_days renders in the manual AND seeds an org currency rule so
the document and the engine can never disagree.

### 2.6 numbering_carryin
| Key | Type | Notes |
|---|---|---|
| keep_legacy_numbers | bool | true → preload uses custom numbers (AIR-MAN-001…) |
| legacy_prefix | text | "AIR" default; orgs may rebrand (e.g. "DRO") |

## 3. Preload manifest (document seeds)

All seed as DRAFT rev 1 (owner reviews → approves via ceremony; nothing
preloaded arrives pre-approved). Owner = postholder role shown.

| Source | DronOps number | Category | Owner role |
|---|---|---|---|
| AIR-MAN-001 Standards & Operations Manual | MAN-001 (or legacy) | manual | accountable_manager |
| AIR-MAN-002 Flight Operations Manual | MAN-002 | manual | ops_manager |
| AIR-POL-001 Quality Policy | POL-001 | policy | accountable_manager |
| AIR-POL-002 QHSE Policy & Code of Conduct | POL-002 | policy | accountable_manager |
| AIR-POL-003 IT Acceptable Use | POL-003 | policy | quality_manager |
| AIR-POL-004 Data Protection | POL-004 | policy | accountable_manager |
| AIR-POL-005 Standard Commercial Terms | POL-005 | policy | accountable_manager |
| AIR-SOP-001 Standard Flight Operations | SOP-001 | procedure | ops_manager |
| AIR-SOP-002 Autonomous Operations | SOP-002 | procedure | ops_manager (only if ops_types includes dock) |
| AIR-SOP-007 Solar PV Inspection (IEC 62446-3) | SOP-007 | procedure | ops_manager (only if service_lines includes solar_pv) |
| AIR-SOP-013 Sales & Tendering | SOP-013 | procedure | accountable_manager |
| AIR-SOP-014 Contract Review | SOP-014 | procedure | accountable_manager |
| Authorization certificates / insurance (from §2.3/§2.5) | EXT-001… | external | quality_manager |

Conditional rows are skipped (not hidden) when scope excludes them.

## 4. Forms: platform-native mapping (IMPORTANT — do not preload as documents)

The source forms pack maps to platform features, not controlled documents.
Preloading them as docx would create the dual-system problem DronOps exists
to kill:

| Source form | DronOps implementation |
|---|---|
| AIR-FRM-001 Pre-Flight Checklist | form_template PREFLIGHT-01 (PR-014 builder), applies_to mission_preflight, jurisdiction-aware items |
| AIR-FRM-002 Flight Log | NOT a form — M6 flight records ARE the flight log |
| AIR-FRM-003 Post-Flight Report | form_template POSTFLIGHT-01 |
| AIR-FRM-025 JSA | form_template / risk-assessment template (M3) |
| AIR-FRM-027 Incident/Near-Miss/Hazard | NOT a form — M3 occurrence flow |
| AIR-FRM-035 NCR | NOT a form — M2 findings module |
| AIR-FRM-013 Bid/No-Bid · FRM-015 Change Request · FRM-036 Improvement | form_template, applies_to generic |

The preloaded MAN-001 §6/Appendix C text must say so: render the register
appendix with a "Platform module" column replacing form references with the
native feature, so the manual documents the system as it actually is.

## 5. Wizard & acceptance

Onboarding step "Load manual suite": collects §2 groups (postholders gated on
person_roles existing) → preview screen (doc list + resolved variables) →
creates drafts + form templates + EXT records → summary with "review & approve
each" checklist feeding the dashboard obligations.

Acceptance: re-running the wizard updates drafts only; approved revisions
untouched; conditional SOPs respect scope; every {{variable}} resolved or the
preview blocks with the missing list; legacy numbering carry-in verified
(AIR-MAN-001 renders as the custom number, uniqueness enforced).

## 6. Flagged to owner (not CC)

Verbatim .docx of AIR-MAN-001/002 + forms pack to be uploaded for placeholder
verification before the template bodies are finalized; until then CC builds
the schema, wizard, manifest and rendering pipeline with section-stub bodies.
