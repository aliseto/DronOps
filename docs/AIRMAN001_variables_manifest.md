# AIR-MAN-001 template — variables manifest

Generated from the verbatim AIR-MAN-001 v1.0 by transformation (prose preserved
exactly; only operator-variable values substituted). Companion file:
`AIR-MAN-001_template.md`.

## Counts

- 24 distinct `{{variable}}` tokens
- 3 `[[param:…]]` configurable-default blocks
- 3 `[[jurisdiction:…]]` conditional tags
- 4 `> DronOps platform note` blocks (describe platform behaviour at §6, §6.4, §26, App C, App D)

## Variables (map to PR-015 onboarding schema groups)

### organization

- `{{organization.legal_name}}` — §1.1 (was the freezone-TBC placeholder)
- `{{organization.trade_name}}` — brand, throughout (incl. cover)
- `{{organization.hq_city_country}}` — §1.1
- `{{organization.operating_geography}}` — §1.1
- `{{organization.headcount_band}}` — §1.1
- `{{organization.doc_prefix}}` — every document code (AIR- → prefix); numbering_carryin.legacy_prefix

### jurisdictions

- `{{jurisdictions.active_display}}` — cover line (was GCAA · DCAA · GACA · DKPPU)

### roles (role_titles group — RBAC-bound + text-only per amendment B4)

- `{{roles.accountable_manager_title}}` (was Managing Director)
- `{{roles.ops_manager_title}}` (was Operations Manager / Head of Ops)
- `{{roles.quality_lead_title}}` (was Quality / HSE Lead)
- `{{roles.chief_pilot_title}}` (was Chief Pilot)
- `{{roles.finance_lead_title}}` (was Finance Lead)
- `{{roles.commercial_lead_title}}` (was Commercial Lead)
- `{{roles.project_manager_title}}` (was Project Manager)

### thresholds

- `{{thresholds.recency_min_flights}}` / `{{thresholds.recency_window_days}}` / `{{thresholds.annual_hours}}` — §20.3 (defaults 3 / 90 / 20)
- `{{thresholds.fin_b1_max}}` … `{{thresholds.fin_b4_max}}` (+ `_plus` band-start variants) — §23.1 (defaults 5,000 / 25,000 / 100,000 / 500,000 AED)

## Notes for the content pipeline

- Abbreviations left verbatim (MD, QHSE, Finance, Commercial) — only full titles are variabilised, so prose reads naturally; the role group should expose both title and abbreviation if abbreviations are later variabilised.
- `[[param:thresholds.financial_approval_matrix]]` wraps the §23.1 table: band edges are the variables above; the band STRUCTURE (5 rows) is fixed, values configurable (amendment B2).
- `[[param:thresholds.recency_rule]]` wraps §20.3 recency row (amendment B3 structured rule).
- Retention table §6.4 keeps the operator’s own (longer) category values as defaults; the platform note clarifies the 36-month floor relationship — these are policy defaults, not variables, unless you want them parameterised later.
- `[[jurisdiction:UAE]]` currently tags the two UAE-law retention clauses (§6.4). Light touch by design; deeper jurisdiction tagging of Part 2 operational clauses can be added if the manual is to render per-jurisdiction variants.