# CLAUDE.md — DronOps (production)

Repo instructions for Claude Code. Read first, then `docs/BUILD_PLAN.md`,
`docs/DESIGN_SYSTEM.md` (appearance) and `docs/UX_SYSTEM.md` (behavior —
its §15 test hooks are release criteria alongside the visual checks).

## What this is

**DronOps** (product of Aironov): multi-tenant SaaS for licensed drone operators —
UAV operations + QMS record-keeping compliant with multiple regulators
simultaneously (GCAA CAR-UAC, DCAA DCAR-UAS, GACA GACAR 107/48, ISO 9001).
Product thesis: **every flight audits itself** — telemetry-derived deviations
auto-raise nonconformities with evidence attached.

Seven modules: M1 Documents · M2 Compliance · M3 Safety & Risk · M4 Operations ·
M5 Fleet · M6 Flight Evidence · M7 Personnel & Crew.

## Authoritative references (in docs/, read before building the related area)

- `AIR-PRD-001 v0.2` — product spec; requirement IDs (D-01, C-04, O-02, F-01,
  E-04, P-01…) referenced throughout the build plan
- `DRO-REG-001 v1.0` — regulatory comparison & implementation matrix; defines
  jurisdiction modes, deadline engine values (3h/72h/10d), retention rules
  (build-to-strictest: 36 months), flight-record union schema, gate rules
- `dronops_requirements_seed.sql` — 52 clause-anchored requirement objects for
  the content library (convert to packages/content data, do not hand-edit)
- `reference/lovable-prototype/` — the validated prototype (read-only UX/SQL
  reference; NEVER import its code; its security-definer SQL patterns for
  SoD/gates are proven and may be re-implemented)

## Stack (pinned)

Next.js 15 (App Router) + TypeScript strict · PostgreSQL + Drizzle (no Prisma) ·
Auth.js v5 (+passkey re-auth for signatures) · Tailwind v4 CSS-first tokens ·
Inngest (jobs) · S3-compatible object storage, content-addressed · next-intl
(en, ar scaffold) · Vitest + Playwright · pnpm monorepo.

## Hard rules (never violate)

1. **No hard deletes.** Append-only `audit_events` on every domain mutation,
   written in the same transaction (`withAudit`). Corrections = new events.
2. **Tenant isolation on every query** via `withTenant`; RLS policies as
   backstop; isolation tests both directions for every new table.
3. **Jurisdiction is a property of the record, not only the org.** Org settings
   enable frameworks; each mission/occurrence/registration binds ONE governing
   jurisdiction that drives its deadlines, gates, validation and retention
   (see DRO-REG-001 §2, §14). Never hardcode a regulator value in app code —
   deadline hours, retention months, finding-level defaults all come from
   `packages/content`.
4. **Segregation of duties in the data layer:** NCR closure verifier ≠ raiser;
   release-to-service requires technician role; management-review seal requires
   Accountable Manager signature; pilots cannot edit flight evidence; gate
   overrides require privileged role + reason + audit event.
5. **Sealed/approved records are immutable** (mission packs, management
   reviews, approved document revisions). Enforced by triggers, not UI.
6. **Form instances pin their template version.**
7. **Evidence files immutable + SHA-256 content-addressed.**
8. **Regulation is content, not code** — `packages/content` ships versioned
   requirement/rule data; a regulation rev is a content change package only.

## Working conventions (owner preferences)

- Mockup/wireframe checkpoint before any new screen; the Lovable prototype
  screenshots are the baseline — match or consciously improve, never regress.
- Sequential small PRs per BUILD_PLAN; skip-and-flag anything unscoped.
- Sentence case UI; identifiers in JetBrains Mono with tabular-nums;
  StatusPill is the only way to render a status.
- Dark default + light theme, both verified per PR; print/PDF always light.
- i18n-wrapped strings; RTL-safe logical properties; UTC storage, tenant-tz
  display with tz visible on audit-relevant timestamps.
- Multi-tenant SaaS posture from day one: org onboarding flow, per-org
  jurisdiction enablement, org-scoped everything; billing integration is
  parked (stub the plan/entitlement check behind one interface).

## Commands

pnpm dev · pnpm db:generate · pnpm db:migrate · pnpm db:seed ·
pnpm test · pnpm test:e2e · pnpm lint · pnpm typecheck

## Repo layout

apps/web · packages/db · packages/ui · packages/content ·
packages/parsers · packages/shared · docs/ · reference/

## Definition of done (every PR)

Typecheck/lint/tests green · tenant-isolation tests for new tables ·
audit event on new mutations · both themes screenshotted · jurisdiction-mode
behavior covered by a test when the PR touches modes · strings i18n-wrapped ·
PR description lists skipped/flagged items.
