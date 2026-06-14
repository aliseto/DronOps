# CLAUDE.md — DronOps design system

Repo instructions for Claude Code. **This repository has been reset to the
design system only.** The application (apps/web) and its data/domain packages
were removed; they will be rebuilt from a forthcoming design plan. Until then,
the deliverable here is the design system: `packages/ui` + `docs/DESIGN_SYSTEM.md`
(appearance) and `docs/UX_SYSTEM.md` (behavior).

Read `docs/DESIGN_SYSTEM.md` and `docs/UX_SYSTEM.md` first. The UX_SYSTEM §15
test hooks are release criteria alongside the visual both-themes check.

## What this is (product context)

**DronOps** (product of Aironov): multi-tenant SaaS for licensed drone
operators — UAV operations + QMS record-keeping compliant with multiple
regulators simultaneously (GCAA, DCAA, GACA, Oman CAA, ISO 9001). Product
thesis: **every flight audits itself** — telemetry-derived deviations auto-raise
nonconformities with evidence attached. The product spans seven modules
(Documents, Compliance, Safety & Risk, Operations, Fleet, Flight Evidence,
Personnel & Crew); the rebuild will re-introduce them from the new plan.

## Current stack

TypeScript strict · React 19 · Tailwind v4 CSS-first tokens · Vitest · pnpm +
Turbo monorepo. `@dronops/ui` is self-contained — no cross-package deps.

## Design-system rules (always apply)

- **Tokens only.** Color carries meaning; all of it flows through semantic
  tokens (`bg-surface`, `text-fg-muted`, `text-status-*`). Raw Tailwind
  color-scale classes are banned by ESLint (see DESIGN_SYSTEM §2.7).
- **StatusPill is the only way to render a record status.** Badge/Tag are for
  counts and categories, never state.
- Sentence case UI; identifiers in JetBrains Mono with tabular-nums.
- Dark (default) + light theme, both first-class and verified; print is always
  light. RTL-safe logical properties (`ms-`/`me-`/`ps-`/`pe-`), never `ml-`/`mr-`.
- Respect `prefers-reduced-motion`; visible focus ring everywhere; WCAG AA in
  both themes; state is color + icon + text, never color alone.

## When the app is rebuilt (carry forward)

These product hard rules governed the prior build and should be re-established
by the new plan: no hard deletes (append-only audit on every mutation); tenant
isolation on every query (RLS backstop); jurisdiction is a property of the
record, not only the org; segregation of duties in the data layer; sealed/
approved records immutable via triggers; form instances pin their template
version; evidence files immutable + SHA-256 content-addressed; regulation is
content, not code.

## Commands

`pnpm test` · `pnpm typecheck` · `pnpm lint` · `pnpm format`

## Repo layout

`packages/ui` (`@dronops/ui`) · `docs/` (DESIGN_SYSTEM, UX_SYSTEM) · `reference/`

## Definition of done (every PR)

Typecheck/lint/tests green · both themes verified when UI changes · strings
sentence-case · tokens-only (no raw colors) · PR description lists skipped/
flagged items.
