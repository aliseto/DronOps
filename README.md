# DronOps — design system

The graphite dual-theme design system for **DronOps** (a product of Aironov):
CSS-first design tokens + a React component kit. The application has been reset
to a clean slate and will be rebuilt on top of this design system from a
forthcoming design plan.

## Monorepo layout

| Path          | Purpose                                                         |
| ------------- | -------------------------------------------------------------- |
| `packages/ui` | Design system: tokens (`tokens.css`) + primitives (`@dronops/ui`) |
| `docs/`       | `DESIGN_SYSTEM.md` (appearance) · `UX_SYSTEM.md` (behavior)    |

## Getting started

```bash
nvm use            # Node 22
corepack enable    # pnpm 10
pnpm install

pnpm test          # component + token tests
pnpm typecheck
pnpm lint
```

## The design system

`@dronops/ui` is self-contained (no cross-package dependencies). It ships:

- **Tokens** — `packages/ui/src/styles/tokens.css`: graphite neutrals + Aironov
  teal accent, dark (default) + light + print themes, mapped to Tailwind v4
  utilities via `@theme inline`.
- **Primitives & composites** — Button, Input, Select/Combobox, DataTable,
  Drawer, Modal, Toast, StatusPill (the only status renderer), EmptyState,
  EvidenceChip, Stat, Tag, SignatureCeremony, and more.

See [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md) and
[`docs/UX_SYSTEM.md`](./docs/UX_SYSTEM.md) for the full appearance and behavior
specs, and [`CLAUDE.md`](./CLAUDE.md) for the conventions every change respects.
