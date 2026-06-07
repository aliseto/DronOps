# CLAUDE.md — DronOps (production)

Repo instructions for Claude Code. Read first, then `docs/BUILD_PLAN.md`,
`docs/DESIGN_SYSTEM.md` (appearance) and `docs/UX_SYSTEM.md` (behavior — its
§15 test hooks are release criteria alongside the visual checks).

## What this is

**DronOps** (product of Aironov): multi-tenant SaaS for licensed drone
operators — UAV operations + QMS record-keeping compliant with multiple
regulators simultaneously (GCAA CAR-UAC, DCAA DCAR-UAS, GACA GACAR 107/48,
ISO 9001). Product thesis: **every flight audits itself** — telemetry-derived
deviations auto-raise nonconformities with evidence attached.

Seven modules: M1 Documents · M2 Compliance · M3 Safety & Risk · M4 Operations ·
M5 Fleet · M6 Flight Evidence · M7 Personnel & Crew.

## Authoritative references (in docs/)

- `docs/AIR-PRD-001.md` — product spec; requirement IDs (D-01, C-04, O-02 …).
- `docs/DRO-REG-001.md` — regulatory comparison & implementation matrix;
  jurisdiction modes, deadline values (3h/72h/10d), retention (build-to-
  strictest: 36 months), flight-record union schema, gate rules.
- `docs/dronops_requirements_seed.sql` — 54 clause-anchored
  requirement objects; convert to `packages/content` data, never hand-edit, and
  never execute against the DB.

## Stack (pinned)

Next.js 15 (App Router) + TypeScript strict · PostgreSQL + Drizzle (no Prisma) ·
Auth.js v5 (+passkey re-auth for signatures) · Tailwind v4 CSS-first tokens ·
Inngest (jobs) · S3-compatible object storage, content-addressed · next-intl
(en, ar scaffold) · Vitest + Playwright · pnpm monorepo. Hosting: Vercel +
Supabase.

## Hard rules (never violate)

1. **No hard deletes.** Append-only `audit_events` on every domain mutation,
   written in the same transaction (`withAudit` / the `mutate()` wrapper).
   Corrections = new events.
2. **Tenant isolation on every query** via `withTenant`; Postgres RLS as
   backstop (custom GUC `app.current_org_id` + restricted `app_user` role, NOT
   Supabase Auth helpers). Isolation tests both directions for every new table.
3. **Jurisdiction is a property of the record, not only the org.** Org settings
   enable frameworks; each governed record binds ONE jurisdiction. Never
   hardcode a regulator value — deadline hours, retention months, finding-level
   defaults all come from `packages/content`.
4. **Segregation of duties in the data layer** via SECURITY DEFINER functions.
5. **Sealed/approved records are immutable**, enforced by triggers, not UI.
6. **Form instances pin their template version.**
7. **Evidence files immutable + SHA-256 content-addressed.**
8. **Regulation is content, not code** — `packages/content` ships versioned
   requirement/rule data.

## Conventions

- Sentence case UI; identifiers in JetBrains Mono with tabular-nums; StatusPill
  is the only way to render a status.
- Dark default + light theme, both verified per PR; print/PDF always light.
- i18n-wrapped strings; RTL-safe logical properties; UTC storage, tenant-tz
  display with tz visible on audit-relevant timestamps.
- Multi-tenant SaaS from day one; billing parked behind a stub entitlement
  interface.
- Never run `drizzle-kit push` — RLS policies don't apply reliably via push.
  Always `db:generate` → `db:migrate`.

## Commands

`pnpm dev` · `pnpm db:generate` · `pnpm db:migrate` · `pnpm db:seed` ·
`pnpm test` · `pnpm test:e2e` · `pnpm lint` · `pnpm typecheck`

## Repo layout

`apps/web` · `packages/db` · `packages/ui` · `packages/content` ·
`packages/parsers` · `packages/shared` · `docs/` · `reference/`

## Definition of done (every PR)

Typecheck/lint/tests green · tenant-isolation tests for new tables · audit event
on new mutations · both themes verified · jurisdiction-mode behavior tested when
touched · strings i18n-wrapped · PR description lists skipped/flagged items.
