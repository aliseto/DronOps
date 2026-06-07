# UX_SYSTEM.md — DronOps interaction & UX standards (v1)

Companion to DESIGN_SYSTEM.md. That file governs appearance; this one governs
behavior. Every rule here is implementable and testable — when a PR touches an
interaction, the relevant section is its acceptance reference.

## 1. UX principles (product-specific)

1. **Zero surprise.** This is a compliance system: users must always be able to
   predict what an action will do and what record it will create. Anything that
   creates a permanent record says so before it happens.
2. **The system never lies, even by omission.** Stale data is labeled stale,
   computed values say when they were computed, manual evidence is visibly
   manual-grade, disabled actions explain why they're disabled.
3. **Exceptions before everything.** Every screen answers "what needs me?"
   before it shows totals, charts, or lists. The dashboard is an inbox of
   obligations, not a gallery of metrics.
4. **Respect the operator's time hierarchy:** field actions (seconds matter) >
   daily ops (minutes) > compliance review (accuracy over speed). Interaction
   cost must match: one-tap occurrence filing; deliberate, friction-ful sealing.
5. **Never punish honesty.** Reporting a deviation, occurrence or mistake must
   be the easiest path in the product. Friction goes on concealment-shaped
   actions (overrides, false-positive dismissals), never on disclosure.

## 2. Navigation & wayfinding

- 7 modules + Dashboard + Settings in the rail; sub-areas are tabs within a
  module, never new rail items. Rail state (collapsed/expanded) persists.
- Every entity has exactly one canonical URL; drawers update the URL
  (`?panel=...`) so any state is shareable and refresh-safe. Back closes the
  drawer before leaving the page.
- Cross-links everywhere: any reference to an entity (NCR ref, flight ref,
  person, aircraft) is a link to it. Users navigate by following evidence
  chains, not by remembering where things live.
- Breadcrumbs on any page deeper than module root. Page titles match nav
  labels exactly (no synonyms between rail, breadcrumb, and header).
- Global search (⌘K / Ctrl-K): searches refs, names, serials, doc numbers
  across modules; results grouped by type; Enter opens, ⌘Enter opens in
  drawer. Recent items shown on empty query.

## 3. Tables (the workhorse)

- Default sort is always meaningful (newest first, or most-urgent first on
  exception lists) and shown in the header. Sort/filter state persists per
  user per table and is reflected in the URL.
- Filters are chips above the table; active filters always visible — never
  hidden behind a panel while silently applied. "Clear all" when ≥2 active.
- Row click opens the detail drawer; modifier-click opens full page. Entire
  row is the target, not just the ref cell.
- Bulk selection only where bulk actions exist; the bar that appears states
  the count and the actions, nothing else.
- Counts are real: tab badges and KPI numbers come from the same query as the
  table they label. A badge that disagrees with its list is a release blocker.
- Virtualize >200 rows; never paginate exception lists (a page-2 obligation
  is a missed obligation) — exception lists scroll, fully loaded.
- Every table has: a designed empty state (see §7), a skeleton, a CSV export.

## 4. Forms & data entry

- Drawer for editing one entity; full page only for multi-section creation
  (mission builder, document revision).
- Autosave drafts for anything over 3 fields; show "Saved" quietly (timestamp
  on hover), never a toast per keystroke.
- Validate on blur, not on keystroke; on submit, scroll to and focus the
  first error; error text says how to fix, not just what's wrong ("Expiry
  must be after issue date", not "Invalid date").
- Required fields marked; optional sections collapsed by default. Never ask
  for data the system already knows — prefill from context (mission →
  jurisdiction, aircraft → type defaults) and show the prefill as editable.
- Selects with >7 options become comboboxes with type-ahead; entity pickers
  show identifying detail (person + role + currency pill; aircraft + reg +
  status pill) so users never pick blind.
- Date/time: tenant timezone displayed with the tz label on anything
  audit-relevant; relative time ("3 h ago") always pairs with the absolute
  timestamp on hover/detail.
- Jurisdiction-aware fields appear/disappear by mission jurisdiction with a
  one-line explanation ("Required for KSA missions — §107.57"), never silently.

## 5. Feedback & system status

- Latency budgets: interaction feedback <100 ms; optimistic UI for reversible
  writes (triage status, acks) with rollback on failure; spinners only after
  300 ms; skeletons for full-region loads; progress bars (with counts) for
  imports and pack generation.
- Toasts: confirmation only for actions whose result isn't visible in place
  ("NCR-2026-019 created — View"). Never toast what the user can already see.
  Errors persist until dismissed; successes auto-dismiss at 4 s.
- Long jobs (log parsing, pack generation) run detached: start → "Processing,
  we'll notify you" → notification + badge on completion. Never trap the user
  on a waiting screen.
- Every async failure states: what failed, what was/wasn't saved, and the
  retry action. No dead-end errors.

## 6. Consequential actions (the compliance spine)

Three escalating tiers — never mix them up:

- **Tier 1 — reversible:** instant, optimistic, undoable where possible
  (assign crew, edit draft, triage). Undo via toast action within 8 s where
  data model allows.
- **Tier 2 — confirm:** dialog states the consequence in one sentence, names
  the object, and the confirm button names the action ("Obsolete revision 2",
  never "OK"). Used for: status transitions, overrides, dismissals.
- **Tier 3 — ceremony:** signature flow (re-auth + meaning statement + hash).
  Used only where the spec requires a signature: approvals, RTS, seals.
  Ceremony UX rules: the meaning statement is shown *before* re-auth; the
  result block (signer, UTC, hash tail) appears immediately after; ceremonies
  are never batched — one signature, one meaning.
- **Gate overrides** (Tier 2+): the blocked state explains the rule and cites
  the clause; "Override" is visually subordinate to "Fix it" actions (assign
  someone current / schedule the inspection); reason is mandatory (min 20
  chars), and the dialog says exactly where the override will be visible
  ("logged in audit history and the next management review"). Friction here
  is a feature.
- **Immutability is communicated, not discovered:** sealed/approved records
  show the lock + "Sealed by … on …" inline; attempting to edit explains the
  amendment path instead of just blocking.

## 7. Empty states & first-run

- Three distinct empty types, never confused: **first-use** (explain what
  lives here + primary CTA + link to docs), **filtered-empty** ("No results
  for these filters" + clear-filters action), **good-empty** (exception lists:
  "Nothing needs your attention" — celebrate, don't apologize).
- Org onboarding is a checklist, not a wizard prison: enable jurisdictions →
  load manual suite → add people → add aircraft → first mission. Each step
  skippable, progress persistent, dismissible when done.
- Coverage matrix first-run is deliberately red: pair it with copy that frames
  gaps as the to-do list ("This is normal for a new organization") so the
  honest default doesn't read as failure.

## 8. Search & filtering

- Filter vocabulary identical across modules (same status names, same
  jurisdiction chips, same date-range control). A filter learned once works
  everywhere.
- Saved views per table (name + filter+sort+columns); "Ops Manager library"
  and "Unmatched flights" ship as system views.

## 9. Notification etiquette

- Notifications are obligations, not activity: credential expiring,
  ack due, deadline approaching, inspection due, deviation raised, approval
  waiting on you. No "X created Y" noise — that's the activity feed's job.
- Each notification: what, whose obligation, when due, one-click to the
  exact record. Grouped by day; badge count = unread obligations only.
- Deadline-bearing notifications escalate visually at 50% elapsed and past
  due (matches DeadlineCountdownPill states).
- Respect quiet config per user (in-app always; email per-category opt-in
  when email exists).

## 10. Field & mobile UX

- Field mode is task-first: My day (assigned missions, in order), the active
  mission's checklist, one-tap occurrence capture, my currency. Everything
  else is reachable but not in the way.
- Touch targets ≥44 px; checklist items are full-row taps with obvious
  checked states; signature and photo capture work one-handed.
- Offline: banner states the mode plainly ("Offline — 3 items queued, will
  sync automatically"); queued items visible and individually inspectable;
  sync conflicts never silently resolve — the later editor is asked.
- Device timestamps preserved and labeled ("captured 09:14, synced 11:02").
- Never require typing in the field that could be a choice: pickers,
  defaults from the mission, voice-to-text for narratives.

## 11. Errors & recovery

- Validation prevents > error messages > exceptions, in that order of
  preference. Gates exist so errors don't.
- Import errors are row-level: the preview table marks each bad row with its
  reason; good rows import; bad rows export back as a fix-list CSV. All-or-
  nothing imports are forbidden.
- Permission errors say what role is needed, not just "forbidden".
- A failed background job notifies the initiator with the diagnostic and a
  retry — silent job death is a release blocker.

## 12. Keyboard & accessibility behavior

- Full keyboard map: ⌘K search · j/k row navigation in tables · Enter open ·
  Esc closes drawer (with dirty-check) · ⌘Enter submit forms.
- Focus is managed: opening a drawer focuses its title; closing returns focus
  to the originating row; ceremonies trap focus until resolved.
- Live regions announce async results (toast content) for screen readers;
  pills expose state as text; countdowns announce at state changes only.
- Reduced motion: skeletons pulse → static; drawer slides → fades.

## 13. Microcopy & tone

- Sentence case everywhere. Verbs on buttons ("Approve mission", "Raise
  finding"). No "please", no exclamation marks, no blame ("This flight
  exceeded the ceiling", never "You exceeded…").
- Regulatory copy cites its source inline and briefly ("§107.71" /
  "UAC.035") with the full clause in a tooltip — authority without noise.
- Numbers carry units always; durations as hh:mm; never "a few" anything.
- Destructive/consequential copy names the object and the consequence;
  confirmation buttons never say "Yes" or "OK".
- The system speaks plainly about itself: "Computed 6 minutes ago",
  "Manual entry — telemetry not available", "Disabled in Settings".

## 14. Anti-patterns (reject in review)

Unexplained disabled buttons · toasts for visible results · modals for
viewing data (drawers exist) · pagination on exception lists · silent
filters · "Are you sure?" without consequence · batch signatures ·
optimistic UI on irreversible writes · placeholder text as labels ·
hover-only information · color-only state · activity noise in
notifications · wizard locks on onboarding · success-toasting a failure
("Saved with 12 errors").

## 15. Test hooks

Playwright suites assert: URL-addressable drawers · filter persistence ·
focus return on drawer close · gate-block + override-reason flow · ceremony
order (meaning before re-auth) · offline queue visibility · row-level import
errors · empty-state variants per table. These are release criteria, same
standing as the visual both-themes check.
