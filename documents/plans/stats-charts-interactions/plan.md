# Plan: Stats charts — chained flow and card interactions (`/stats/insights`)

## Context

`/stats/insights` shipped with six charts in six cards, and it queried **all six**
the moment the route resolved, then again on every date change. Delivered, tested
and spec'd that way: `sdd/stats-insights/spec.md` FR-004 ("on first load the page
uses…"), FR-008 ("re-runs **all six** getters"), FR-020 ("renders **six**
cards"), AC-002 and AC-005.

That turns out to be the wrong shape for the page. Six `network-only` queries on
entry is six round trips before the user has expressed any intent, and a user who
only cares about 1RM pays for calories, volume and trend anyway. It also
compounds NFR-002, the accepted risk that the Workbox service worker leaves a
permanent IndexedDB record per `{ operationName, variables }`.

The requested change, in three parts:

1. **A chained flow.** Pick what to plot → pick the dates → press **"Ver
   gráficas"**. Nothing is requested until the button.
2. **One card per section, extracted.** Each card becomes its own component so
   later interactions (which charts to show, which chart type) live there instead
   of in the page.
3. **A hover on calendar days** (`accent/70`), which needs a documented exception
   to the `accent` reservation in `ui-conventions.md` §1.

This Plan implements that. The Spec is `sdd/stats-insights/spec.md`, amended by
**Correction 9** (the flow change) and **Correction 10** (the `accent` exception),
with **FR-022..FR-025** added and **FR-004 / FR-008 / FR-020 / AC-002 / AC-005 /
AC-011 / TEST-018 / TEST-019 / TEST-021** amended in place.

### What does _not_ change

- All six queries, their field selections, the wrappers, the mappers, the caps,
  the seven chart shapes, `stats-chart.theme.ts`.
- `app-stats-date-range` and its validation (FR-006/FR-007) — composed as-is.
- `app-stats-section` and `app-stats-chart` — `app-stats-insights-card` composes the
  former, it does not modify it.
- The routes, the back link, the global error notification, the per-section retry.

## Status

Not started. Phases 0–6 pending.

## Decisions

- **Amend the Spec in place rather than write a second one.** The six queries and
  the six card shapes survive; only _when_ a query fires and _which_ section is
  fetched changed. A new Spec would duplicate the backend contract, the six VM
  families and twenty-two existing test IDs to describe a change smaller than
  either. Corrections 9 and 10 carry the amendment, which is the precedent this
  Spec already set for the FR-006/FR-007 contradiction.

- **`accent/70` on hover, with the reservation amended rather than ignored.**
  `ui-conventions.md` §1 reserves `accent` for new/alternative/free features and
  forbids it as a page CTA. The hover is neither: it is a transient affordance on
  a cell inside an already-open popover, it commits nothing, and it carries no
  meaning of its own. What matters is that the exception is **written down**
  (§1.1) — otherwise the §6 role check reads it as a violation on every future
  pass. Two states are excluded from the hover for a reason that is about
  legibility, not color: the selected day keeps its fill (that fill is the field's
  current value) and a disabled day gets `disabled:hover:bg-transparent` because
  Tailwind applies `:hover` to `<button disabled>` in some browsers.

- **One metric, not several.** The first step is a single-choice `app-select`.
  Six metrics is already six queries' worth of choice; multi-select would move the
  decision back to "pick N things, then push a button", which is the same problem
  in a worse shape. The section key **is** the metric key, so a single select maps
  1:1 onto one query with no grouping decision to get wrong.

- **Unevaluated cards are not rendered.** No metric selected → zero cards. A card
  in a "not consulted" state is a card the user must learn to ignore, and it costs
  a DOM node and a header. The trade is that switching metrics is a full swap
  rather than an accumulate — which is what a single-select already implies.

- **The card is per section, not per chart.** `volume` (FR-013) has two charts and
  stays one card. The section is simultaneously the query's granularity and the
  granularity of `loading` / `error` / `empty` / `retry`; splitting its two charts
  into two components would mean one of them owns a `refreshing` flag it cannot
  know is correct. Per-chart interactions (chart type, show/hide) therefore go
  _inside_ the card, which is exactly the point of extracting it.

- **`charts` is an array of signals, not an array of values.** A mapper result is
  a `computed`, so the card needs the signals themselves; passing a plain
  `Options[]` would make the page rebuild an array on every render and defeat the
  change detection the `computed` was there to avoid.

- **The card derives `loading` / `refreshing`; the page does not.** `loading =
loading && !hasData` and `refreshing = loading && hasData` are the pair that
  satisfies AC-005, and the first delivery got it wrong by passing the raw
  `loading` — the skeleton hid the previous chart on every refetch. Deriving them
  per card in the page meant six copies of the rule. One place now.

- **The state keeps its six subjects, and that is what makes "zero requests on
  entry" true.** The alternative — building the triggers lazily on first `run` —
  trades a structural property for bookkeeping. The subjects are already seeded
  with `null` and `switchMap` maps `null` to `EMPTY`, so a constructed subject
  emits nothing. Route entry fires zero getters because of that guard, not because
  a constructor happens to be empty.

- **`applyRange` is replaced by `run(section, range)`, not extended.** FR-008's
  cancellation is the valuable part and it survives untouched: `run` is still a
  `switchMap` `next()` per section, so a second press while a request is in flight
  still discards the superseded response. Only the trigger changes. TEST-019 is
  rewritten against `run`, keeping the same guarantee.

- **The applied range is not the pending range.** The card subtitle and `retry`
  read the _applied_ range, so the header can never label a chart with a range the
  user has typed but not yet run. The pending range lives in
  `app-stats-insights-controls` until `run` fires. This also means the page
  reflects nothing back into the widget after mount — a parent write would
  overwrite what the user is editing.

- **`app-select` is used despite being a raw `<select>`.** `ui-components.md` §3
  forbids hand-rolled native controls for new forms, and `select.html:6` is one.
  It is also the control with 47 existing call sites, a `FormControl` contract
  like every other form component, and no custom dropdown to maintain. Rejected
  alternative: a new custom dropdown, which would be a third dropdown pattern
  next to `app-multi-select` and `workout-actions-menu`. **Recorded as known
  debt, not endorsed** — if the app ever migrates off raw selects, this call site
  is one of the reasons the debt exists.

- **The chained flow tightens NFR-010 rather than stretching it.** The page gains
  a third child component and loses the `card()` factory, the `@switch` over
  sections and the constructor `load()`. It should end up **shorter** than the
  196 lines it has today; if it does not, the extraction did not do its job.

## Non-goals

- **No chart-type switcher yet.** FR-024 extracts the component that will hold it;
  making the mappers take a type parameter touches seven builders and their tests
  and is a separate change.
- **No multi-metric selection.** See Decisions.
- **No persistence of the last-used metric/range.** The page still holds its state
  in signals for the lifetime of the route (NFR-001).
- **No change to the Workbox cache growth (NFR-002).** This change reduces how much
  of it a page visit creates; the accepted risk and its follow-up stand.
- **No migration of `app-select` off a raw `<select>`.**
- **No change to the four `app-input [type]="'date'"]` call sites.**
- **No hover on the `training-history` month calendar.** That is a second
  hand-rolled grid in another feature, governed by another spec; changing it here
  would be cross-feature churn. Worth a follow-up if the hover is liked.

## Tasks (test-first, one at a time)

Each phase writes or updates its `*.spec.ts` **before** the implementation it
covers, and validates before moving on.

### Phase 0 — Spec and Plan (done)

- `sdd/stats-insights/spec.md`: Correction 9 and 10; FR-004, FR-008, FR-020
  amended; FR-022..FR-025 added; NFR-003 and NFR-010 amended, NFR-011 added;
  Architecture + Card inventory + Files + Implementation Notes updated; AC-002,
  AC-005, AC-011 amended, AC-013..AC-016 added; TEST-018, TEST-019, TEST-021
  amended, TEST-023..TEST-025 added.
- `documents/design/ui-conventions.md` §1: the `accent` row note, the new §1.1
  exception, and the hard-rule reference to it.
- `documents/design/ui-components.md` §3: the hover rules on the `app-input-date`
  entry.
- This Plan.

### Phase 1 — Calendar day hover (FR-025)

- `shared/components/ui/input-date/input-date.html`: on the day `<button>`, add
  `'hover:bg-accent/70': !day.isDisabled && !day.isSelected`,
  `'disabled:hover:bg-transparent': day.isDisabled`, and `transition-colors` to
  the base class list.
- `tailwind.config.js`: add `hover:bg-accent/70` to the safelist next to the
  existing `hover:bg-accent/25`. Correction 4 records that literal classes in
  templates are collected through `content`, so the safelist entry is belt-and-braces
  for a class applied through `[ngClass]`.
- Tests: **TEST-025** in `input-date.spec.ts` — enabled non-selected day has the
  hover class; the selected day does not; a disabled day has
  `disabled:hover:bg-transparent` and no hover fill.

### Phase 2 — `app-stats-insights-controls` (FR-022)

- `shared/interfaces/stats-insights.interface.ts`: `StatsInsightsMetricOption`.
- `shared/components/widgets/stats/stats-insights-controls/`: `ng g c` stub, then
  implement. Composes `app-select` + `app-stats-date-range` + `app-btn` +
  `app-spinner`. Owns a pending `LocalDateRange` seeded from `[from]`/`[to]`, and
  a `FormControl<StatsInsightsSection | null>` for the select. Emits only `run`.
- Tests: **TEST-023**.

### Phase 3 — `StatsInsightsState.run` (FR-023)

- `core/services/stats/stats-insights.state.ts`: delete `load()`, replace
  `applyRange()` with `run(section, range)`. `currentRange` documented as the
  **applied** range. The six subjects, the `null → EMPTY` guard and `switchMap`
  are untouched.
- Tests: **TEST-018** rewritten (constructor fires zero getters; `run` fetches one
  section; range + timezone on every query; per-section error isolation; `retry`
  with the applied range) and **TEST-019** rewritten against `run`.

### Phase 4 — `app-stats-insights-card` (FR-024)

- `shared/components/widgets/stats/stats-insights-card/`: `ng g c` stub, then
  implement. Wraps `app-stats-section`; derives `loading` / `refreshing`; renders
  `charts` as `app-stats-chart` per non-`null` options signal; exposes
  `<ng-content select="[cardExtras]">` in the content branch only.
- Tests: **TEST-024**.

### Phase 5 — Page wiring (FR-020, FR-022, FR-023)

- `pages/stats/stats-insights/stats-insights.ts`: drop the constructor `load()` and
  the `card()` factory; add `selected`, `pendingRange`, `visibleCards`,
  `isRunning`, `onRun`. Keep the notification effect and `retry`.
- `pages/stats/stats-insights/stats-insights.html`: hero →
  `app-stats-insights-controls` → `@for` over `visibleCards()` →
  `app-stats-insights-card`, with the `@switch` extras projected into
  `[cardExtras]`.
- Tests: **TEST-021** rewritten.

### Phase 6 — Validation and documentation

- Gates below.
- `documents/engineering/architecture.md` §3 folder tree and §5 service table for
  the two new widgets and the `run` entry point.
- `sdd/stats-insights/spec.md`: mark TEST-023..TEST-025 with ✅ and their spec files,
  and AC-013..AC-016 with evidence, matching how the delivered IDs are marked.
- Report in `documents/reports/`.

## Validation

- `npm run lint`
- `npm run typecheck`
- `npm run test:ci` — full Karma/Jasmine suite green. Repeat `--include` per spec;
  a comma-separated list does not work, and two `ng test` processes cannot run in
  parallel on the fixed Karma port.
- `npm run build` — exit 0; note the pre-existing initial-budget **warning**
  (854 kB vs `maximumWarning: 500kB`, below the 1 MB error threshold) and that
  `highcharts` must remain a lazy chunk.
- `npx prettier --check` on the touched files only — repo-wide there is
  pre-existing debt (138 files on `format:check`) that this change neither
  creates nor fixes.
- **Visual pass on an authenticated `/stats/insights`** — the chain in order, the
  disabled button, the spinner on press, a `refreshing` card that keeps its chart,
  a metric swap, and the day hover with a selected day and a disabled day on
  screen. Required: the AC-005 defect on the previous delivery was found only by
  looking at the page, and e2e cannot produce this evidence
  (`e2e/auth.setup.ts` uses placeholder credentials).

## Risks

- **Phase 3 is the expensive one.** `applyRange` backs FR-008, TEST-019 and
  AC-011, and TEST-019 is the out-of-order-protection test — the highest-value
  test in the suite. It gets rewritten, not deleted, and its guarantee is
  asserted against `run`.
- **`isRunning` is a single flag for one section.** With a single-select there is
  only ever one in-flight section, so a `computed` over the visible card's entry
  is enough. It stops being enough the moment a multi-select returns; that change
  would move the flag into the state as a counter.
- **A stale card cannot survive a metric swap** because `visibleCards` filters on
  `selected`. Worth asserting explicitly, since the failure mode (the previous
  metric's chart still on screen under the new metric's title) reads as correct
  at a glance.
