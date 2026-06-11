# BUILD_PLAN.md v2.1 — DronOps production (Claude Code)

**This is the canonical, in-repo plan: it reflects what is built, not what v1/v2
proposed.** Supersedes v1 (Aironov Assure) and v2. Incorporates the DronOps
rename, M7 Personnel & Crew, the extracted GCC regulatory content (54
requirements, 5 frameworks), DRO-REG-001 jurisdiction-mode architecture, and
everything the Lovable prototype validated. Target unchanged: **P0 exit =
Aironov runs 100% of its own operations here for 30 consecutive days, zero
parallel spreadsheets.** Multi-tenant SaaS posture from PR-001.

## 0. Naming & modeling rulings (locked)

- **`organizations` / `org_id` is canonical** (not `tenants`/`tenant_id`). Do not
  rename.
- **`persons` ≠ `memberships`** by design: `memberships` = platform access
  (owner/admin/member); `persons` = operational identity (may exist without a
  user, linked via `user_persons`). Domain RBAC lives in `person_roles`.
- **Domain roles are a fixed code vocabulary** (`@dronops/shared` DOMAIN_ROLES:
  accountable_manager, quality_manager, ops_manager, pilot, technician,
  auditor_guest), referenced by string — not a tenant/global table. Role guards
  read `person_roles`, never `memberships.role`.
- **Auth.js, not Supabase Auth** → tenant isolation is a custom GUC
  (`app.current_org_id`, `SET LOCAL`) + restricted `app_user` role
  (`NOBYPASSRLS`, no DELETE). `withTenant`/`withAudit`/`mutate` are the only
  sanctioned write path.
- **Regulation is content** (`packages/content`); the DB stores only
  `requirement_ref` strings.
- **Document approval is single-signature by role (QM/AM).** The author MAY
  approve their own revision — there is deliberately NO author≠approver rule for
  documents (small operators would deadlock, since the QM authors most
  controlled docs). Segregation of duties stays strict where the spec demands it
  (NCR closure verifier ≠ raiser; release-to-service = technician). External
  documents have their own status model (valid / review-due / expired by review
  date) and never enter the approval lifecycle.
- **Oman (CAA) is in the jurisdiction set** (PR-016) — content frameworks
  CAR-102 / CAR-47 (regulation) + AWR 033 (guidance);
  occurrence deadlines immediate + 3-day, 122 m ceiling default, retention clause
  CAR 102.025(12). **M4 flag: Oman approval-basis = AWR 033 permit structure
  (type new/extension/renewal, permit no., per-location rows, window) + required
  green-zone confirmation (who/when) + standing media-attribution condition** —
  build with the M4 mission PRs. DRO-REG-001 v2.0 is the in-repo reference.
- **ISO 9001 content addendum** (PR-017, seed `_iso_v1.2.sql`) — 20 clauses,
  framework `ISO 9001` → jurisdiction `ISO`, kind `standard` (added to the kind
  enum: ISO is a standard, not a regulator). Summaries are paraphrases — ISO
  holds copyright in the text. Total content is now **92 requirement objects
  across 9 framework strings**; the count test asserts the parsed number, so a
  bad regeneration fails CI rather than drifting.

## 1. Phase 0 — canonical PR sequence (as built)

All on branch `claude/magical-heisenberg-ECY6G` (draft PR #1), each CI-green and
verified against the live Supabase project `DronOps Dev` (ap-south-1).

| PR | Scope | Status |
|----|-------|--------|
| **PR-001** | Monorepo scaffold, TS strict, Tailwind v4, ESLint (raw-color ban), Prettier, Turbo, Vitest, Playwright, CI, docs | ✅ |
| **PR-002** | Design tokens — graphite dual theme (dark/light/print via `data-theme`), `@theme inline`, fonts, theme toggle | ✅ |
| **PR-003** | UI primitives (core) + **StatusPill** (single status source) + 7-module AppShell | ✅ |
| **PR-004** | DB spine — custom-GUC RLS, `app_user` (no DELETE), append-only `audit_events`, immutability triggers, SoD helper, `withTenant`/`withAudit`/`mutate` | ✅ |
| **PR-005** | Auth.js v5 — email+password (JWT), route protection, passkey step-up scaffold | ✅ |
| **PR-006** | Org core — organizations / memberships / org_jurisdictions + onboarding checklist (Dubai dual-layer advisory) | ✅ |
| **PR-007** | Content package — `dronops_requirements_seed.sql` → generated, zod-validated framework modules (54 requirements) | ✅ |
| **PR-008** | Jurisdiction engine (`packages/shared`) — deadlineFor / capaDeadlineFor / retentionFor / completenessFor / gatesFor reading `packages/content/rules` | ✅ |
| **PR-009 (A)** | Primitive completion (FormField, Tabs, Toast, Tooltip, EmptyState, Skeleton, Checkbox/Radio/Switch, Select, Combobox, DateField, Drawer, Modal) + **DataTable** (virtualized) + **/dev/ui** review surface + RTL smoke | ✅ |
| **PR-010 (C)** | persons / user_persons / person_roles + domain RBAC guards + **audit_events monthly partitioning** + Timeline primitive + generic HistoryDrawer | ✅ |
| **PR-011 (B)** | files (immutable, SHA-256 content-addressed) + signatures (immutable) + Supabase Storage evidence bucket + FileDrop + SignatureCeremony (Tier-3) + SignatureBlock | ✅ |

> Numbering note: the original v1 split foundations across PR-001–010 and v2
> added PR-010.5 (content). This repo's commit history compressed them into
> PR-001–006, then content (PR-007) + engine (PR-008), and the three foundation
> catch-up PRs A/C/B land as **PR-009/010/011**. M1 starts at **PR-012**.

### Architecture (unchanged from v2)

Next.js app + Inngest workers + Postgres/Drizzle + Supabase Storage +
`packages/content`. Jurisdiction engine is pure functions over content rules; no
inline regulator logic anywhere. `org_jurisdictions` enables per-org; each
governed record binds one jurisdiction.

### Schema state (built so far)

Spine: `audit_events` (partitioned), `organizations`, `memberships`,
`org_jurisdictions`, `persons`, `user_persons`, `person_roles`, `files`,
`signatures`; Auth.js identity tables (`users`/`accounts`/`sessions`/
`verification_tokens`/`authenticators`/`webauthn_challenges`, RLS deny-all).
Module tables (M1–M7) are added by their milestone PRs per §3.

## 2. Remaining open foundation items (flagged, not blocking)

- **Inngest** — config/skeleton only; no jobs wired yet (first needed at M6
  ingestion / partition roll-forward / currency snapshots).
- **`app_user` runtime connection** — LOGIN + password provisioned per
  environment; RLS proven via the live SQL harness. Onboarding/auth/files use the
  admin client this phase.
- **Storage + service-role key** — wired in code; `SUPABASE_SERVICE_ROLE_KEY`
  provisioned per environment.
- **Notifications / exceptions-first dashboard** ✅ (PR-037, P0) — in-app
  obligations inbox on /dashboard: one role-aware aggregation
  (`server/obligations.ts`) over every module's EXISTING exception logic
  (acks due · approvals waiting · finding triage/CAPA · occurrence clocks ·
  mission approval/crew blocks · fleet grounded/registration/maintenance ·
  unsealed flights · crew readiness/credential expiry), grouped
  overdue → due-soon → open via `@dronops/shared` obligations (derived state,
  no job). Badge = open obligations (cleared by doing the work, not by
  read-marks). **Email per-category opt-in still flagged — no provider.**
  Per-module nav badges deferred (would put the full aggregate on every
  layout render).

## 3. Forward sequence (modules)

Module ordering follows v2 (gates depend on M7; ingestion feeds M5/M7). Exact
numbers assigned as each PR opens.

**M1 Documents — PR-012–015**
- PR-012 Documents + revisions ✅ — CRUD (no hard delete), draft→in_review→
  approved single-stage approval (one Tier-3 ceremony, role-gated QM/AM, wired to
  PR-011 SignatureCeremony), signature BOUND to the revision (tamper-evident),
  obsolete-forever-viewable, server numbering per category (+custom override),
  six categories with external on its own valid/review-due/expired model and a
  Replace flow, document↔requirement links, register + tabbed revision drawer
  (Overview/Revisions/Requirements/History) + role-aware exceptions (D-01/D-02).
- PR-013 Distribution + acks ✅ — per revision, role/person audience, ack due
  dates, acks immutable; "Acks due" as personal obligations (D-03, in-app only).
- PR-014 Form-template builder ✅ — versioned (edit active → n+1, retire n;
  active/retired immutable), instances pin version (hard rule 6), field types
  incl. photo/GPS/signature, conditional sections, bilingual labels, FormRenderer
  (D-05).
- PR-015 Manual-suite pre-load (D-04) ✅ — parameter schema + onboarding wizard +
  preload manifest + **stub-body rendering pipeline** (verbatim bodies land as a
  later content commit — the stub-first acceptance test). Per spec v1.1: bid
  bands, structured pilot recency rule, RBAC vs text-only postholders,
  legal-register → platform-module pointer, jurisdiction-conditional rendering,
  legacy numbering carry-in, drafts-only re-run, scope-conditional SOPs.
  **Flag: Indonesia (DGCA PM 37/2020) content pack is a future task — no `IDN`
  jurisdiction mode yet, so FOM DGCA blocks gate on it and don't render today.**

**M1 Documents is complete (PR-012–015).**

**M7 Personnel & Crew (PR-018)** — currency engine (credential wallet currency +
operator recency ≥3/90 d configurable + KSA §107.71 knowledge recency + Oman
medical gate 102.185) → fit-to-fly ReadinessVerdict per person × airframe class ×
jurisdiction; both **not-fit and unknown block assignment** (reason distinguishes
renew vs obtain). Duty/rest engine (DUOSAM OSO#17) gated to **specific-category**
Dubai ops with a distinct `not-applicable` state (never amber for an uncovered
pilot). **OSO#17 numeric values loaded (v1.4, PR-020)**: duty ≤780 min/day
(−60/extra area), rest ≥ max(last-duty, 480 min), ≥1 day off/7 d; the block-time
rule (≤240 min/day) shows "awaiting M6" until flight records exist. Tables:
`credentials`, `recency_events` (append-only; the **M6 flight seam** — source
`m6_flight`), `duty_records` (incl. `extra_flight_areas`), `org_currency_rules`. Crew roster (readiness-pill
dominant, filter/sort, ≤90 d expiry count, recency N/M denominator, no-wallet
obligation) + person Drawer (Overview/Credentials/Recency/Duty/History) with the
logged override path.

**M5 Fleet (PR-021)** — `aircraft` (registration jurisdiction-bound, airframe
class, firmware), `aircraft_components` (GCS/payloads/batteries),
`maintenance_records` (append-only logbook, AC 107-01 schema). Fleet engine
derives `asset` status (grounded if condition grounded OR registration lapsed →
in-maintenance → due-soon in the registration renewal window → operational),
reading REGISTRATION_GATES (GACA Part 48 6-mo window). Fleet roster
(status-dominant, filter/sort, registration + next-maintenance columns) + asset
Drawer (Overview/Components/Maintenance/History) with add aircraft / set
condition / add component / log maintenance.

**M6 Flight Evidence (PR-022)** — `packages/parsers` CSV flight-log parser
(DJI flight-record / Airdata column-mapping) → normalized ParsedFlight (duration,
block time, max altitude, distance via haversine, min battery, GPS track), tested
on synthetic fixtures; the encrypted DJI `.DAT` decoder and **parser validation
against real logs are the one held step**. `flight_records` (FK aircraft + pilot,
one jurisdiction, draft→reconciled→sealed; sealed immutable via trigger). Flight
engine `flightDeviations` (ceiling exceedance vs CEILING_DEFAULT_M, low-battery)
— the "every flight audits itself" inputs. Evidence screen: ingest (CSV) → list →
flight Drawer (Telemetry / Deviations / History) with reconcile (computes
deviations) + seal. **Seams kept as-is**: deviation→NCR/CAPA auto-raise lands
with M2/M3; recency/duty block-time wiring into M7 stays "awaiting M6" until
real-log validation.

**M4 Operations (PR-023)** — the keystone. A mission binds one jurisdiction + one
operationalCategory (the input the no-mixing requirement gate AND the
duty-applicability gate read). Approval lifecycle on the same record (DronOps is
the system of record, NOT the approval system): planning → submitted_for_approval
→ approval_in_progress → approved → ready → flown (+ rejected/withdrawn off-ramps).
Roles: operations_team (plan→submit + ops steps), approval_admin (the
authority-facing submit→approved; records application ref/authority + uploads the
returned approval). Document flows: inbound (AOI KML→permitted-locations, client
docs at planning), outbound (approval/permit at approved). The **crew currency +
duty gate** (missionReadiness composing fitToFly + dutyProjection) activates at
approved → ready — **this flips the M7 duty coverage from the org-level proxy to
per-assignment** (specific/advanced = OSO#17 applies). Oman approval-basis = AWR
033 permit + per-location rows + green-zone confirmation + media-attribution.
Two-level disclosure: missions list → triage **drawer** (status, basis summary,
crew-gate verdict, what's blocking) → full mission **page**. Block→override→audit
journey covered in operations/engine.test.

**M4 activity thread (PR-024)** — the history Timeline made writable: an
append-only operational log (NOT chat) per mission, interleaving manual notes
(author + body + optional content-addressed attachment) with the mission's own
audit events. `mission_notes` (append-only by trigger); `interleaveActivity` pure
helper (newest-first, drops the note_added twin). Composer on the full page +
latest-note/count in the triage drawer. Async only — no real-time/threading/
reactions/mentions.

**M2 Compliance — deviation→finding loop (PR-025)** — closes the "every flight
audits itself" loop. `findings` + `capa_actions`; the finding engine
(@dronops/shared compliance/findings) maps deviation severity→level
(high/medium/low → major/minor/observation), content-driven CAPA due windows
(capaRuleFor), the lean lifecycle (open→containment→capa-in-progress→verify→
closed + false-positive off-ramp = StatusPill ncr vocab), triage, and the SoD
guard. **The inbound trigger is SEAL**: sealFlight auto-raises one open/untriaged
finding per deviation with the sealed log pre-attached (atomic, audited,
idempotent). **SoD in the data layer** (enforce_finding_sod SECURITY DEFINER:
raiser ≠ verifier, Hard Rule 4) + closed/false-positive immutable + no hard
delete (enforce_finding_terminal); all four invariants SQL-probed. Triage reason
REQUIRED for the signal-weakening outcomes (downgrade, false-positive), optional
for accept, logged to audit always. Two-level disclosure: findings list + triage
queue → finding drawer (evidence-inline triage) → full finding page (lifecycle,
CAPA, SoD-guarded close, immutable-when-terminal). Migration 0017 applied.

**M2 Compliance — coverage matrix (PR-026)** — the QMS view (C-01/C-02) and the
gap list audit packs are built from. `requirement_coverage` (org × requirement_ref
→ covered/partial/gap/n-a + controlling document + note; unassessed → gap; living
assessment, audited; migration 0018, upsert + per-tenant SQL-probed). Engine
(@dronops/shared compliance/coverage): coverageByFramework + overallCoverage (n-a
excluded from %, sorted most-gaps-first). **Two scoping paths are asymmetric**:
coverage spans ALL enabled frameworks (UAE = CAR-UAC + DCAR-UAS + ISO, the
operator's enablement choice — Dubai-based may enable DCAA only), while a MISSION
binds ONE enabled REGULATOR layer (isRegulator/missionBindableJurisdictions — ISO
never mission-gated; createMission enforces) and gates/duty derive from it
(DUOSAM/OSO#17 only on UAE-Dubai high-tier). UI: /compliance gains a Findings |
Coverage sub-nav; coverage = overall % + per-framework bars → matrix grouped by
framework → assess drawer (status + controlling-document link + note). **Gap →
audit finding** (raiseFindingFromGap: source='audit', idempotent) — the second
inbound to the loop alongside flight deviations.

**M2 Compliance — management review (ISO 9.3, PR-027)** — the OPERATIONAL/aviation
QMS review (not a business review). A dated, period-scoped record at
/compliance/reviews (Findings | Coverage | Reviews sub-nav). Lean assembly:
summarizeReviewInputs (@dronops/shared) freezes the §9.3 operational inputs —
audit/coverage + nonconformities (M2), operational performance (missions M4,
deviation-finding trend M6, crew currency M7, fleet airworthiness M5), resource
adequacy — into a snapshot; narrative §9.3.2 inputs (prior-action follow-up,
customer SAFETY feedback only, risk/opportunity effectiveness, improvements) +
§9.3.3 outputs are authored on the draft. Accountable-manager Tier-3 e-sign
(reuses SignatureCeremony/recordSignature, signature bound to the review) freezes
the snapshot and makes the record IMMUTABLE (enforce_management_review_immutability;
no hard delete). Draft edit = quality_manager|accountable_manager; sign =
accountable_manager. Migration 0019 (draft_editable/signed_immutable/delete_blocked
SQL-probed). NO financial/sales/HR inputs by design. KPIs are displayed pulls, not
a new engine.
**M2 audit packs ✅ (PR-028)** — free-selection evidence bundles + print/PDF.

**M3 Safety ✅ (PR-029–035)** — occurrence vertical (capture → deadline clock →
investigation → escalate, PR-029) · risk-assessment mission gate (S-03, PR-030) ·
hazard/risk register (S-02, PR-031) · safety performance dashboard (S-07,
PR-032) · regulator occurrence-report export (S-06, PR-033) · SORA GRC/ARC→SAIL
determination workflow (S-04, PR-034) · **OSO robustness assignment (PR-035)**:
JARUS SORA 2.0 Table 6 (24 OSOs × SAIL I–VI) encoded in
`@dronops/shared` safety/oso (single source of truth, invariant- and
spot-tested), rendered on the SORA builder at the determined SAIL. Flag:
Table 6 values cross-verified against three independent transcriptions —
primary-PDF spot-check (jarus-rpas.org, Table 6 p. 29) recommended before a
regulator-facing release.

**Next: P0 hardening** (notifications, dogfood migration, offline PWA, QA pass).
✅ **30-day clock starts** at the end of hardening.

## 4. Phase 1+ (epic level)

Org self-serve onboarding + entitlements · Arabic regulator-facing outputs ·
STS-B1 declaration workspace · TMS currency bridge · duty/rest engine (OSO#17
values — flagged) · dock telemetry · client portal · KSA data-region decision at
first KSA tenant.

## 5. Testing strategy

Unit (Vitest): tenancy/audit helpers, SoD rules, jurisdiction engine
(table-driven against DRO-REG-001), content loader zod, hashing/canonicalization,
currency + inspection math (as built). Golden-file parser suite (M6).
Both-directions tenant-isolation tests for every org-scoped table (live SQL
harness now; `tenantIsolationSuite` guarded on DATABASE_URL for CI). The suite
supports seeded FK parents (`seedSql`, neutral third org), `$N` per-insert
uniqueness, and a one-row-per-org variant (UPDATE isolation) — all 38 org-scoped
tables are covered (`organizations` excluded by design: self-keyed RLS, no
app_user insert path; auth tables are RLS deny-all). **Flag: DronOps Dev is
behind repo migrations — occurrences / hazards / audit_packs / risk_assessments
tables missing; run `pnpm db:migrate` before the M3 suites can execute there.**
E2E
(Playwright): auth redirect + sign-in, app-shell nav, dual-theme, RTL smoke; the
G8 end-to-end story test becomes the release gate as modules land.

## 6. Flag-don't-improvise

1. Real DJI logs — M6 parser BUILT on synthetic fixtures + CSV path (PR-022);
held: validate the parser + the encrypted .DAT decoder against real logs, then
flip the M7 recency/duty-block-time seams live. 2. Email provider (notifications).
3. Prototype data export contents (dogfood migration). 4. OSO#17 numeric duty
values — LOADED (v1.4, PR-020); block-time rule awaits M6. 5. STS-B1 publication
(Phase 1). 6. Manual-suite
parameterization fields (PR-015). 7. ISO 9001 clause content — separate
authoring task, never invented. 8. Any new top-level table → schema proposal in
the PR description first.
