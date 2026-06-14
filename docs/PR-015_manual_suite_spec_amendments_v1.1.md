# PR-015 SPEC AMENDMENTS v1.1 — post-verification against source documents

Verified against: Aironov Standards & Operations Manual v1.0 (37 sections +
3 appendices), Flight Operations Manual v1.0 (10 chapters), Operations Forms
Pack v1.0 (8 forms — exactly the manifest set). Apply these amendments to
docs/PR-015_manual_suite_spec.md; everything not listed is confirmed as
specced.

## A. Section-reference corrections (spec §2.5 "Used in" column)

| Parameter | Spec said | Actual |
|---|---|---|
| financial_approval_matrix | §21 | **§23 Financial Controls & Approval Authority** |
| bid_nobid_threshold | §14 | §14 confirmed — but see B1, it's banded |
| insurance limits | §24 | **§26 Insurance & Legal Register** |
| pilot currency | §7.4 | **§20 Competence, Training & Pilot Currency** |
| kpi_targets | §33 | **§35 KPI Dashboard & Management Review** |
| Doc register appendix | App C | confirmed (Appendix C) |

## B. Schema upgrades (source is richer than the spec assumed)

**B1. bid_nobid is a 4-band matrix, not one threshold.** §14 defines value
bands (found: ≤150,000 / 150,001–500,000 / 500,001–2,000,000 / >2,000,000 AED)
each with its own approval path. Replace `bid_nobid_threshold_aed` with
`bid_bands: rows {band_min, band_max, approver_role}` (4 rows, values
editable, band structure fixed).

**B2. financial_approval_matrix has known anchor values** (§23: AED 5,000 and
25,000 delegation steps; §16 references 25,000/100,000 for project changes;
§28 site-safety escalation at 100k/500k). Wizard pre-fills the source values
as editable defaults instead of empty-required — the operator tunes rather
than invents.

**B3. Pilot currency is a structured rule, not a day count.** §20 actual rule:
"≥ 3 flights in last 90 days **on the airframe class**, else refresher flight
with Chief Pilot before next mission." Replace `pilot_currency_days:int` with
`recency_rule: {min_flights:int=3, window_days:int=90, scope:'airframe_class',
lapse_action:text}`. This seeds the org currency rule AND renders §20 —
and note for the currency engine: recency evaluation is per airframe class,
which the engine's recency_events already support via aircraft type.

**B4. Role-title mapping (titles differ from platform vocabulary).** Source
titles → domain roles, rendered via a `role_titles` parameter group so the
manual can keep its language:
| Manual title | Platform role |
|---|---|
| Managing Director (MD) | accountable_manager |
| Operations Manager / Chief Pilot | ops_manager |
| Compliance Lead (FOM ch.2.3) | quality_manager |
| QHSE Lead | quality_manager (or ops_manager — wizard choice) |
| Commercial Lead | no platform role — text-only postholder (24 mentions; keep as parameter, not RBAC) |
| Finance Lead, Project Manager | text-only postholders |
| IT Custodian | text-only postholder |
Add to §2.2: postholders split into **RBAC-bound** (AM, Ops, Compliance/QM)
and **text-only** (Commercial, Finance, PM, IT) — the wizard renders both but
only RBAC-bound ones require person_roles.

**B5. Legal register (§26 / AIR-REG-GEN-LEG-01) maps to platform, not text.**
The manual references a live register of licences, permits, certificates,
insurance, registrations with expiry/renewal/owner — that IS the EXT document
category + credentials + aircraft registrations. Render §26's register
reference as a "Platform module" pointer (same rule as the forms in spec §4):
the preloaded text says the register lives in DronOps, listing which module
holds each entry type.

**B6. FOM roles add Visual Observer and Stop-Work Authority (ch. 2.5–2.6).**
No schema change, but the preloaded FOM text references VO as a crew role —
matches mission_crew roles — and stop-work authority is universal (renders
as-is, no parameter).

## C. Jurisdiction finding — Indonesia (DGCA)

The FOM references four regulators including **DGCA (Indonesia)** as an
operating jurisdiction (ch. 1.2). The platform's jurisdiction modes are
UAE-Federal / UAE-Dubai / KSA / ISO; the content seed has no DGCA rows
(deliberate — DGCA PM 37/2020 wasn't in the uploaded source set).
Resolution for PR-015: jurisdiction-conditional rendering — FOM ch. 1.2/2/x
jurisdiction blocks render only for org-enabled jurisdictions; the DGCA block
is included in the template gated on a future 'IDN' mode and therefore does
not render today. Flag in BUILD_PLAN: Indonesia content pack (DGCA PM
37/2020 extraction) is a future content task, needed before Aironov's own
Indonesia operations dogfood in the platform.

## D. Forms pack — confirmed exactly as manifest

AIR-FRM-001/002/003/013/015/025/027/035 — matches spec §4 one-to-one,
including the platform-native mappings (002→M6, 027→M3, 035→M2). No
amendments.

## E. Content-commit packaging

Owner-verified template bodies will be delivered as one content commit:
per-document markdown/structured bodies with {{variables}} applied per this
amended schema, section numbering preserved, the §26 and Appendix C
platform-module pointers inserted, and jurisdiction blocks tagged. CC's
pipeline from the base spec consumes them without code changes — that is the
acceptance test of the stub-first build.
