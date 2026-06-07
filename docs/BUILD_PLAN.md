# BUILD_PLAN.md v2 — DronOps production (Claude Code)

Supersedes v1. Incorporates: the DronOps rename, M7 Personnel & Crew, the
extracted GCC regulatory content (54 requirements, 5 frameworks), DRO-REG-001
jurisdiction-mode architecture, and everything the Lovable prototype validated.
Target unchanged: **P0 exit = Aironov runs 100% of its own operations here for
30 consecutive days, zero parallel spreadsheets.** Multi-tenant SaaS posture
from PR-001.

## 0. What the prototype settles (don't re-litigate)

Validated and carried forward: the design system in both themes; StatusPill
status vocabulary; gate + logged-override interaction; currency-snapshot model;
security-definer SoD pattern (close_finding, approve_revision); deny-by-default
RLS with org-scoped policies; seal-immutability triggers; the G3 document
scoping decisions (6 categories, single-stage approval, obsolete-forever-
viewable, server-generated numbering, external docs skip approval); the
jurisdiction two-layer model (org enables, record binds).

Prototype disposal: GitHub-sync export lands in `reference/lovable-prototype/`
read-only. No code import. If real dogfood data accumulated in Lovable Cloud,
a one-time CSV/SQL export migrates it at PR-034 (flagged item — owner confirms
what exists).

What CC unlocks vs Lovable: real background jobs (Inngest), server-side PDF
rendering, **binary DJI log parsing** (restored to plan — Node can do what Deno
edge couldn't), offline-first PWA field capture, proper preview-deploy review
flow, and region-controlled Postgres for the KSA data-residency decision.

## 1. Architecture (delta from v1)

Unchanged: Next.js app + Inngest workers + Postgres/Drizzle + object storage +
packages/content. New emphasis:

- **packages/content** is now real on day one: convert
  `dronops_requirements_seed.sql` into typed TS modules (one file per
  framework) with a zod-validated loader; also home to: deadline rules
  (UAE-Federal accident 3h, UAE-Dubai 72h, KSA 10d), retention rules (36-month
  default; Dubai personnel employment-end+36m), CAPA defaults (GCAA 7/60/90d),
  recency rules (KSA §107.71 24-month), registration validity (KSA Part 48
  3y/6m window), and the flight-record completeness matrix from DRO-REG-001 §5.
  DB stores requirement_ref strings only.
- **Jurisdiction engine** (packages/shared): pure functions
  `deadlineFor(record, jurisdiction)`, `retentionFor(...)`,
  `completenessFor(flight, jurisdiction)`, `gatesFor(mission)` — all reading
  content data. Every consumer (UI, jobs, pack generator) calls these; no
  inline regulator logic anywhere.
- **Tenancy**: organizations = tenants; org_jurisdictions table;
  plan/entitlement stub interface (`getEntitlements(org)`) so billing can bolt
  on later without refactor.

## 2. Schema deltas from v1 §2

Keep v1 schema; apply: rename Assure→DronOps in comments only; add
`org_jurisdictions`; missions/occurrences/aircraft-registrations carry
`jurisdiction`; findings gains GCAA level-mapping fields; credentials gains
`kind='knowledge_recency'`; flights gains take-off/landing areas, flight rules,
op-type, airspace-approval ref, pilot sign-off signature_id (union schema);
`pack_generations` (insert-only, hash-stamped); `retention metadata` computed,
never enforced by deletion. The prototype's proven SQL mechanisms (counters
table for refs, security-definer functions, immutability triggers) become the
canonical migration patterns.

## 3. PR sequence — Phase 0

Foundations (PR-001–010) as v1 with three changes:
- **PR-002** Design tokens: import DESIGN_SYSTEM.md as-is (rename instances of
  Assure→DronOps); add print stylesheet tokens.
- **PR-006** DB core now includes `org_jurisdictions` + org onboarding wizard
  skeleton (create org → enable jurisdictions → invite members).
- **PR-010.5 (new) Content package.** Convert the seed SQL to packages/content
  TS data + loader + the rule tables above; unit tests assert every requirement
  id from the seed loads and every DRO-REG-001 §15.1 locked decision has a
  corresponding rule entry. ✅ jurisdiction engine functions return correct
  values for the 3h/72h/10d and 7/60/90d cases.

M1 Documents (PR-011–014): as v1, but locked to the G3 scoping decisions
(categories incl. external, single-stage approval, server numbering with
custom-number override, obsolete-forever-viewable, in-app notifications only).

M7 Personnel (PR-015–016, moved earlier than v1 because gates depend on it):
credential wallet incl. external + recency kinds, verification workflow, type
approvals, currency snapshot engine (jurisdiction-aware per content rules),
person dashboard. ✅ KSA pilot without recency event → lapsed citing §107.71.

M5 Fleet (PR-017–019): as v1 + drone type profiles, per-jurisdiction
registrations with KSA Part 48 expiry logic, AC 107-01 maintenance logbook
schema, firmware register.

M6 Ingestion (PR-020–023): CSV import first (prototype-validated mapping incl.
union-schema columns), then **DJI TXT binary parser** in packages/parsers with
golden files (owner supplies 10+ real logs — flagged), FlightHub 2 cloud pull,
auto-tabulation fan-out, mission auto-match + unmatched queue, deviation engine
with the full rule set incl. night-without-approval (real sunset calc now —
suncalc, not the fixed-window approximation) and jurisdiction-aware
completeness validation at reconcile. ✅ each rule has a tripping fixture.

M4 Operations (PR-024–027): mission builder with jurisdiction binding,
currency/asset/registration gates + logged override, approval chains with
signatures, ops calendar with M7 availability, clients/projects/sites with CSV
import, forms engine (templates/instances, jurisdiction-aware preflight
families per DRO-REG-001 §9), pilot end-of-operation sign-off for UAE-Dubai
flights, mission pack seal.

M2 Compliance (PR-028–031): coverage matrix per enabled jurisdiction
(grouped by framework, guidance-flagged AC rows), NCR/CAPA with SoD +
deviation→NCR closed loop + GCAA level defaults & repeated-finding escalation,
internal audits, management review compile+seal, **server-side PDF audit
packs** (regulator/ISO/mission audiences, hash-stamped into pack_generations,
time-boxed guest links).

M3 + occurrence engine (PR-032): occurrences with jurisdiction deadline
countdowns (3h/72h/10d), reportable-category lists per framework,
escalate-to-finding, hazard register + risk assessments (simple + SORA-style
profiles).

Hardening (PR-033–036): notifications (in-app + email via provider — flagged),
dashboards (exceptions-first, live activity from audit_events), dogfood data
migration from prototype (flagged: confirm source), offline PWA field capture,
P0 QA pass (both themes, RTL smoke, perf, backup/restore drill).
✅ **30-day clock starts.**

## 4. Phase 1+ (epic level)

Org self-serve onboarding + entitlements · Arabic regulator-facing outputs ·
STS-B1 declaration workspace (content update when publication confirmed —
DRO-REG-001 §15.2) · TMS currency bridge · duty/rest engine with OSO#17 values
transcribed (flagged in DRO-REG-001) · dock telemetry · client portal ·
KSA data region decision at first KSA tenant.

## 5. Testing strategy

As v1, plus: jurisdiction-engine table-driven tests are first-class (every
deadline/retention/gate value asserted against DRO-REG-001); golden-file
parser suite; the end-to-end story test from the prototype's G8 (intake →
mission → override → approval → preflight → import → deviation → NCR → CAPA →
close → management review → pack) automated in Playwright as the release gate.

## 6. Flag-don't-improvise

1. Real DJI logs before PR-021. 2. Email provider (PR-033). 3. Prototype data
export contents (PR-034). 4. OSO#17 numeric duty values (Phase 1). 5. STS-B1
publication (Phase 1). 6. Hosting/region for production Postgres (decide at
PR-001: provider + region, owner call). 7. Any new top-level table → schema
proposal in PR description first.
