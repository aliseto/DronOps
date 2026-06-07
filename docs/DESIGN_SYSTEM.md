# DESIGN_SYSTEM.md — DronOps design kit (v2 — graphite)

Shared-spine design system for DronOps (product of Aironov). v2 replaces the
green-cast neutral palette with **pure graphite neutrals**; the Aironov teal
accent is unchanged and is now the only brand color on screen — color means
state, nothing else. Inter / JetBrains Mono, sentence case, token-driven,
**dual theme: dark (default) and light**, both first-class.

## 1. Principles

1. **Evidence looks different from opinion.** Telemetry-backed values, signed
   records and computed statuses get distinct treatment (mono font, evidence
   chips, status pills). Free text never masquerades as system fact.
2. **Color = meaning.** On graphite, the only chroma is the accent (primary
   actions, active nav, brand) and status colors (state). Decorative color is
   a defect.
3. **Density with hierarchy.** Ops users live in tables: compact rows, strong
   column alignment, accent used sparingly.
4. **State is color + icon + text, never color alone.**
5. **Both themes first-class; print is always light.** RTL-ready throughout.

## 2. Token architecture

Three layers, CSS custom properties, switched via `data-theme` on `<html>`:
primitive → semantic → component. Components consume semantic tokens only.

### 2.1 Primitive palette

Accent ramps from Aironov teal `#44D7A8`. Neutrals are **pure gray — zero
cast**. Status hues tuned for legibility on graphite.

```css
:root {
  /* accent (Aironov teal) */
  --teal-50:#ECFBF4; --teal-100:#D2F5E6; --teal-200:#A8EBD0;
  --teal-300:#74DFB5; --teal-400:#44D7A8; --teal-500:#1FBE8C;
  --teal-600:#159A72; --teal-700:#137A5C; --teal-800:#125F49;
  --teal-900:#0F4A3A; --teal-950:#072A21;

  /* graphite neutrals (pure, no cast) */
  --gray-0:#FFFFFF;  --gray-25:#FAFAFB; --gray-50:#F4F5F6;
  --gray-100:#E8EAEC; --gray-200:#D3D6D9; --gray-300:#B1B6BB;
  --gray-400:#8D9399; --gray-500:#6E767D; --gray-600:#545B61;
  --gray-700:#3F454B; --gray-800:#2E3236; --gray-850:#24272A;
  --gray-900:#1D2024; --gray-925:#17191C; --gray-950:#111315;
  --gray-975:#0B0D0E;

  /* status */
  --amber-300:#F0C97E; --amber-400:#E5A93D; --amber-500:#C68A20; --amber-700:#8A5E12;
  --red-300:#EFA4A8;   --red-400:#E06A70;   --red-500:#C9474E;   --red-700:#8F2B30;
  --blue-300:#9DBCE0;  --blue-400:#6293C8;  --blue-500:#3D6FA8;  --blue-700:#2A4E78;
  --violet-400:#9A7FD1; /* reserved: external/guest context */
}
```

### 2.2 Semantic tokens — dark theme (default)

```css
:root, [data-theme="dark"] {
  color-scheme: dark;

  /* backgrounds */
  --bg-app:        var(--gray-950);
  --bg-surface:    var(--gray-925);
  --bg-raised:     var(--gray-900);
  --bg-inset:      var(--gray-975);
  --bg-hover:      color-mix(in oklab, var(--gray-850) 70%, transparent);
  --bg-selected:   color-mix(in oklab, var(--teal-400) 12%, transparent);

  /* foreground */
  --fg-primary:    #ECEEF0;
  --fg-secondary:  var(--gray-300);
  --fg-muted:      var(--gray-500);
  --fg-disabled:   var(--gray-700);
  --fg-inverse:    var(--gray-950);
  --fg-on-accent:  #052019;

  /* borders */
  --border-subtle: var(--gray-850);
  --border-default:var(--gray-800);
  --border-strong: var(--gray-600);
  --border-focus:  var(--teal-400);

  /* accent — unchanged Aironov teal */
  --accent:        var(--teal-400);
  --accent-hover:  #5FE0B6;
  --accent-active: var(--teal-500);
  --accent-subtle: color-mix(in oklab, var(--teal-400) 12%, transparent);

  /* status (tinted bg + readable fg) */
  --status-ok-fg:      var(--teal-300);   --status-ok-bg:      color-mix(in oklab, var(--teal-500) 16%, transparent);
  --status-warn-fg:    var(--amber-300);  --status-warn-bg:    color-mix(in oklab, var(--amber-500) 16%, transparent);
  --status-danger-fg:  var(--red-300);    --status-danger-bg:  color-mix(in oklab, var(--red-500) 16%, transparent);
  --status-info-fg:    var(--blue-300);   --status-info-bg:    color-mix(in oklab, var(--blue-500) 16%, transparent);
  --status-neutral-fg: var(--gray-300);   --status-neutral-bg: color-mix(in oklab, var(--gray-500) 16%, transparent);

  /* evidence grade */
  --evidence-telemetry: var(--teal-400);
  --evidence-cloud:     var(--blue-400);
  --evidence-manual:    var(--amber-400);

  --shadow-raised: 0 4px 16px rgb(0 0 0 / .5);
  --overlay:       rgb(0 0 0 / .6);
}
```

Note on success-vs-accent: on graphite, success states reuse the teal family
(--status-ok). This is deliberate — success and brand share a hue, and the
neutral background keeps pills legible (the v1 problem of green-on-green is
gone). If success/brand separation is ever needed, introduce a distinct green
(#4CAF7D family) as a content-level decision, not ad hoc.

### 2.3 Semantic tokens — light theme

```css
[data-theme="light"] {
  color-scheme: light;

  --bg-app:        var(--gray-25);
  --bg-surface:    var(--gray-0);
  --bg-raised:     var(--gray-0);
  --bg-inset:      var(--gray-50);
  --bg-hover:      color-mix(in oklab, var(--gray-100) 70%, transparent);
  --bg-selected:   color-mix(in oklab, var(--teal-500) 10%, transparent);

  --fg-primary:    var(--gray-950);
  --fg-secondary:  var(--gray-700);
  --fg-muted:      var(--gray-500);
  --fg-disabled:   var(--gray-300);
  --fg-inverse:    #ECEEF0;
  --fg-on-accent:  #FFFFFF;

  --border-subtle: var(--gray-100);
  --border-default:var(--gray-200);
  --border-strong: var(--gray-400);
  --border-focus:  var(--teal-600);

  --accent:        var(--teal-600);   /* darker for AA on light */
  --accent-hover:  var(--teal-700);
  --accent-active: var(--teal-800);
  --accent-subtle: color-mix(in oklab, var(--teal-500) 10%, transparent);

  --status-ok-fg:      var(--teal-700);  --status-ok-bg:      var(--teal-50);
  --status-warn-fg:    var(--amber-700); --status-warn-bg:    #FCF3E0;
  --status-danger-fg:  var(--red-700);   --status-danger-bg:  #FBEAEA;
  --status-info-fg:    var(--blue-700);  --status-info-bg:    #EAF1F9;
  --status-neutral-fg: var(--gray-600);  --status-neutral-bg: var(--gray-50);

  --evidence-telemetry: var(--teal-600);
  --evidence-cloud:     var(--blue-500);
  --evidence-manual:    var(--amber-500);

  --shadow-raised: 0 2px 10px rgb(17 19 21 / .10);
  --overlay:       rgb(17 19 21 / .40);
}
```

### 2.4 Print tokens (first-class — audit & mission packs)

Print and server-rendered PDFs always use light tokens plus:

```css
@media print, .print-context {
  --bg-app:#FFFFFF; --bg-surface:#FFFFFF; --bg-inset:var(--gray-50);
  --fg-primary:#0E1011; --border-default:var(--gray-300);
  /* status pills render with icon + text + 1px border; tints lighten 50% */
}
```

Pack header band: doc id + revision + generated-at UTC + content-hash tail in
mono; footer: page x of y. No accent-filled elements in print except the thin
header rule.

### 2.5 Typography

```css
--font-sans: "Inter", "Noto Sans Arabic", system-ui, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, monospace;
```

| Token | Size/line | Weight | Use |
|---|---|---|---|
| text-display | 28/34 | 650 | page titles (rare) |
| text-title | 20/28 | 600 | section/card titles |
| text-heading | 16/24 | 600 | subsections, drawer titles |
| text-body | 14/22 | 450 | default UI text |
| text-small | 13/18 | 450 | table cells, secondary |
| text-micro | 11.5/16 | 500 | labels, pills (sentence case, +0.01em) |
| text-mono | 13/18 | 450 | IDs, serials, hashes, durations, counters |

Tables: `font-variant-numeric: tabular-nums`. Every system identifier in mono.
Arabic pairs with Noto Sans Arabic; +10% line-height under `lang="ar"`.

### 2.6 Space, radius, elevation, motion

```css
--space-1:4px --space-2:8px --space-3:12px --space-4:16px
--space-5:20px --space-6:24px --space-8:32px --space-10:40px;
--radius-sm:6px; --radius-md:10px; --radius-lg:14px; --radius-pill:999px;
--ring: 0 0 0 2px var(--bg-app), 0 0 0 4px var(--border-focus);
--ease: cubic-bezier(.2,.8,.2,1); --dur-fast:120ms; --dur-med:200ms;
```

Micro-motion only; nothing that carries compliance meaning animates; respect
`prefers-reduced-motion`.

### 2.7 Tailwind v4 wiring

Map semantic tokens via `@theme inline` (utilities: `bg-surface`,
`text-fg-muted`, `border-default`, `text-status-warn`…). ESLint rule bans raw
Tailwind color-scale classes in packages/ui — semantic tokens only.

## 3. Primitives (packages/ui — build order)

Unchanged from v1, validated by the prototype: Button (primary/secondary/
ghost/danger) · IconButton · Input/Textarea (mono variant) · Select/Combobox ·
Checkbox/Radio/Switch · DateField/DateRange (UTC-backed, tenant tz) ·
FormField · Badge · **StatusPill** (single source of state styling) · Tag ·
Card · Stat · **DataTable** (sticky inset header, 36px compact rows, sort/
filter/pin, virtualized, CSV hook) · Tabs · Drawer (end-side; primary detail
surface) · Modal (confirmations + signature ceremony only) · Toast · Tooltip/
Popover · EmptyState · Skeleton · Breadcrumbs/PageHeader · AppShell (7-module
nav rail + Dashboard + Settings) · FileDrop (hash shown after upload) ·
Timeline (audit trail).

## 4. Domain components

### 4.1 StatusPill vocabulary (unchanged)

Currency: current/expiring(n d)/lapsed/unverified · Asset: operational/due
soon/in maintenance/grounded · Mission: draft/pending approval/approved/in
progress/reconciling/sealed(+lock) · NCR: open/containment/CAPA in progress/
verify/closed/false positive · Document: draft/in review/effective/obsolete
(strikethrough id) · Coverage: covered/partial/gap/n-a.

### 4.2 Composites (incl. prototype-validated additions)

- EvidenceChip — grade dot + label + mono hash tail
- CurrencyCard (M7) — credential pills + fit-to-fly verdict
- CoverageMatrix (M2) — requirement × evidence; cells are coverage pills
- DeviationCard (M6) — rule, expected vs actual (mono), triage actions
- InspectionMeter (M5) — progress vs trigger, 80%/100% thresholds
- SignatureCeremony / SignatureBlock — re-auth, meaning, signer + UTC + hash
- TraceViewer (M6) — map + trace + geofence overlay, deviations pinned
- OpsCalendar (M4) — mission blocks by status, M7 availability overlay
- **DeadlineCountdownPill** (new, M3) — regulatory clock (3h/72h/10d):
  info >50% remaining → warn ≤50% → danger past due; stops on
  reported_to_authority_at; tooltip cites the clause
- **JurisdictionBadge** (new) — UAE-Federal / UAE-Dubai / KSA / ISO chips,
  neutral-tinted, used on missions, occurrences, requirements, registrations
- **ReadinessVerdict** (new, M4) — go/caution/no-go card from gate evaluation
- **OverrideBadge** (new) — amber marker on gate-overridden assignments;
  click reveals reason, who, when

## 5. Patterns

Page anatomy: PageHeader → filter bar → DataTable → end-side Drawer. Nav:
**7 modules + Dashboard + Settings** (Intake/Scheduling/Readiness live inside
Operations; Regulator packs inside Compliance). Dashboards: stats → exceptions
("needs me today") → trends; exceptions before charts. Forms: 2-col desktop,
autosave drafts; signing/destructive actions confirm with consequence text.
Field PWA: bottom tabs (My day · Missions · Capture · Me), 44px targets,
offline banner + queued count. Charts read colors from tokens only.

## 6. Accessibility bar

WCAG AA in both themes (--fg-muted on --bg-surface ≥ 4.5:1 at text-small);
visible focus ring everywhere; tables keyboard-operable; state never by color
alone; RTL smoke test in CI.
