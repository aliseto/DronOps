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
- **Notifications / exceptions-first dashboard** — placeholder; lands at P0
  hardening.

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
pilot); OSO#17 numeric values remain a flagged open item (pending owner). Tables:
`credentials`, `recency_events` (append-only; the **M6 flight seam** — source
`m6_flight`), `duty_records`, `org_currency_rules`. Crew roster (readiness-pill
dominant, filter/sort, ≤90 d expiry count, recency N/M denominator, no-wallet
obligation) + person Drawer (Overview/Credentials/Recency/Duty/History) with the
logged override path. **Next milestone: M5 Fleet.**

**Then** (per v2 ordering): M5 Fleet · M6 Flight Evidence
(DJI parser — flagged: real logs) · M4 Operations · M2 Compliance (coverage
matrix + NCR/CAPA closing the deviation→finding loop) · M3 Safety & occurrence
engine · P0 hardening (notifications, dogfood migration, offline PWA, QA pass).
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
harness now; `tenantIsolationSuite` guarded on DATABASE_URL for CI). E2E
(Playwright): auth redirect + sign-in, app-shell nav, dual-theme, RTL smoke; the
G8 end-to-end story test becomes the release gate as modules land.

## 6. Flag-don't-improvise

1. Real DJI logs before M6 parser. 2. Email provider (notifications).
3. Prototype data export contents (dogfood migration). 4. OSO#17 numeric duty
values (Phase 1). 5. STS-B1 publication (Phase 1). 6. Manual-suite
parameterization fields (PR-015). 7. ISO 9001 clause content — separate
authoring task, never invented. 8. Any new top-level table → schema proposal in
the PR description first.
