# DronOps

Multi-tenant SaaS for licensed drone operators — UAV operations + QMS
record-keeping compliant with multiple GCC regulators simultaneously (GCAA
CAR-UAC, DCAA DCAR-UAS, GACA GACAR 107/48, ISO 9001). A product of **Aironov**.

> Product thesis: **every flight audits itself** — telemetry-derived deviations
> auto-raise nonconformities with evidence attached.

## Monorepo layout

| Path                 | Purpose                                                       |
| -------------------- | ------------------------------------------------------------ |
| `apps/web`           | Next.js 15 (App Router) application                           |
| `packages/db`        | Drizzle schema, RLS, `withTenant`/`withAudit` spine          |
| `packages/ui`        | Design system: tokens + primitives (`@dronops/ui`)           |
| `packages/content`   | Regulation-as-content (requirements, rules) — versioned data |
| `packages/parsers`   | Flight-log parsers (CSV, DJI binary)                         |
| `packages/shared`    | Pure helpers: env parsing, ids, result types, jurisdiction   |
| `docs/`              | Build plan, design/UX systems, regulatory references         |
| `reference/`         | Read-only prototype reference (never imported)               |

## Getting started

```bash
nvm use            # Node 22
corepack enable    # pnpm 10
pnpm install

# Database (Supabase). Set env first — see .env.example
pnpm db:migrate

pnpm dev           # http://localhost:3000
```

## Environment

Copy `.env.example` to `.env` and fill in:

| Var                   | Purpose                                              |
| --------------------- | ---------------------------------------------------- |
| `DATABASE_URL`        | Pooled connection (port 6543), restricted app role   |
| `DIRECT_DATABASE_URL` | Direct connection (port 5432), for migrations        |
| `ADMIN_DATABASE_URL`  | Privileged connection (jobs/seed, bypasses RLS)      |
| `AUTH_SECRET`         | Auth.js session secret                               |
| `AUTH_URL`            | App origin (WebAuthn RP ID derives from this)        |

## Commands

`pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm typecheck` · `pnpm test` ·
`pnpm test:e2e` · `pnpm db:generate` · `pnpm db:migrate` · `pnpm db:seed`

## Conventions

See [`CLAUDE.md`](./CLAUDE.md) for the hard rules (no hard deletes, tenant
isolation, jurisdiction-as-record-property, SoD, immutability, regulation-as-
content) that every change must respect.
