# Plan: Stats charts — date-range analytics page (`/stats/insights`)

## Context

`/stats` shows four worker-precomputed snapshots over the whole history. It
cannot answer _"how did my training change between these two dates?"_ — there is
no date input anywhere in the app, and its four queries are unparameterized by
design.

`wave-fit-api` now exposes a second, independent stats namespace (`stats-charts`):
six read-only queries that aggregate the raw training history **on demand** for a
user-chosen range. Nothing is pre-computed and nothing needs persisting, so this
is a pure frontend feature — read-only, no domain layer, no storage layer.

`documents/reports/stats-charts.md` records unrelated earlier work on
`feat/stats-charts` (Highcharts DI bootstrap, chart containment, routine-name
resolution for the `/stats` **dashboard**). It shares this feature's name and
nothing else; its fixes — the shared theme, `app-stats-section`, `app-stats-chart`
and the `highcharts-chart` containment rule in `styles.css` — are exactly the
assets this feature builds on.

The Spec is `sdd/stats-insights/spec.md` (FR-001..FR-021, BR-003/004/005,
NFR-001..NFR-010, TEST-001..TEST-022, AC-001..AC-012). This Plan implements it.

Two components were already scaffolded with `ng g c` and are Angular 20 CLI stubs
with empty classes:

```bash
ng g c shared/components/ui/input-date                   # app-input-date      / InputDate
ng g c shared/components/widgets/stats/stats-date-range  # app-stats-date-range / StatsDateRange
```

## Status

> **Delivered on `feat/stats-charts` (unpushed).** Phases 0–7 implemented;
> 676 unit tests green, `lint` / `typecheck` / `build` pass. Report:
> [`../../reports/stats-charts-range.md`](../../reports/stats-charts-range.md).
>
> Two items are **not** closed:
>
> 1. The visual pass in Phase 7 / Validation was not performed. AC-006
>    (NFR-004 containment) and AC-007 (NFR-005 label rotation) are the only
>    acceptance criteria without evidence, and e2e cannot produce it
>    (`e2e/auth.setup.ts` uses placeholder credentials).
> 2. The 120-day boundary is the conservative reading of an ambiguous backend
>    description; see the corresponding Decision below. Open for `wave-fit-api`,
>    blocked nothing.
>
> Three Spec corrections were resolved during delivery and are recorded in
> their source-of-truth Specs: the FR-006/FR-007 out-of-order contradiction, the
> `dd/MM/yyyy` vs `toDisplayString()` contradiction (Correction 8), and the
> refetch precedence defect behind AC-005.

## Decisions

- **A separate Spec, not an amendment to `sdd/stats/spec.md`.** The two features
  differ in data origin (worker snapshot vs on-demand aggregation), query shape
  (unparameterized vs one shared input), freshness model (`computedAt` vs live)
  and granularity. Amending would have produced one Spec describing two
  contracts. `sdd/stats/spec.md` gets a cross-reference in `Context` and a
  correction to its FR-001 + Architecture (its route stops being a leaf) in the
  same change scope, at validation time — the same precedent the `/stats` spec
  set when it removed `/user/trackings/stats`.

- **`/stats` becomes a `loadChildren` route, not a flat `stats/charts` sibling.**
  `loadChildren` + `stats.routes.ts` is what every other multi-route feature in
  the app already does (`exercises`, `plans`, `routines`, `my-week`, `user`). A
  flat `path: 'stats/charts'` entry would be one line instead of five but would
  leave `/stats/insights` with no real parent, and the page↔dashboard relationship
  (entry button, back link) would be convention rather than routing. The header
  needs **no** change: `isActive()` compares with `startsWith`, so `/stats/insights`
  keeps `/stats` highlighted.

- **Two components, not one.** The calendar popover is a generic date control
  that belongs in `ui/` next to `app-input`, `app-input-number` and
  `app-input-search`; the _range_ (two coupled dates, a 120-day cap, presets) is
  stats-specific and belongs in `widgets/stats/`. Folding them together would
  put date-picking logic inside a feature widget and make it unreachable for
  every other form. This also keeps `StatsDateRange` dumb: it composes two
  `app-input-date` and owns an internal `FormGroup`, so ReactiveForms never
  leaks into the page (§7.1).

- **`InputDate` keeps its generated name.** `ui/` has two live naming
  conventions: `FormInputComponent` / `FormSelectComponent` and
  `InputNumber` / `InputSearch` / `InputDate`. The generated name matches the
  second, which is the one the folder siblings use. Renaming for symmetry with
  two files would be churn with no benefit.

- **`app-input-date` is not a replacement for `app-input [type]="'date'"]`.**
  Four existing call sites (profile birthdate, strength-metrics, weight, coach
  form) would each need a migration and a spec touch. That is cross-feature
  churn and a different change. `ui-components.md` §3 will document
  `app-input-date` as the preferred control for **new** date fields.

- **The range is validated client-side _and_ server-side.** The widget mirrors
  the backend's three rules (valid `yyyy-MM-dd`, `from <= to`, span ≤ `maxDays`)
  purely for inline feedback; a `BadRequest` still surfaces through the
  section's error card. The frontend is not trusted as the only gate.

- **Out-of-order dates are corrected, over-long ranges are rejected.** Picking a
  `from` after the current `to` pushes `to` forward: there is an obvious
  intended value. A span over `maxDays` has none, so it is rejected with a
  message naming the limit. One rule, two behaviors, decided by whether a
  correction is unambiguous. This decision resolved a contradiction in the Spec
  (FR-007 originally listed `from > to` as a rejection case while FR-006
  required correcting it); FR-007, TEST-004 and AC-003 were aligned to FR-006.

- **`maxDays` is a single exported constant**, `STATS_INSIGHTS_MAX_RANGE_DAYS`, read
  by the widget, the state and the tests. A literal `120` in a template is how
  the backend limit and the frontend limit silently drift apart.

- **The 120-day boundary is assumed, not confirmed.** The backend description
  says "rango <= 120 días", which reads either as `to - from <= 120` or as 120
  inclusive calendar days. This plan implements the conservative reading —
  invalid when `daysBetween(to, from) > maxDays` — which can only under-accept
  relative to an inclusive rule, never over-accept. If the backend confirms the
  inclusive rule, the fix is `>` → `>=` in one comparison. **Open question for
  `wave-fit-api`; it does not block any task.**

- **Cancellation is structural, not bookkeeping.** Each section's state is one
  `BehaviorSubject<StatsInsightsQueryInput>` consumed through `switchMap`, so
  `applyRange()` is a single `next()` and a late response for a superseded range
  physically cannot reach `data`. The alternative — tracking and unsubscribing
  `Subscription`s per section — is the same code with more states to get wrong.

- **`refreshing` is derived, not stored.** `loading() && data() !== null` is
  computed in the page, exactly like the existing `sectionEmpty`. Adding a fourth
  field to the state entry would let `loading` and `refreshing` disagree.
  Consequently `app-stats-section` gains exactly two inputs: `refreshing` and
  `subtitle`. No new card shell is introduced.

- **No `computedAt` on this page.** On-demand queries have no snapshot timestamp,
  so "Actualizado: …" would be a lie. The card header shows the selected range
  instead — that is what `subtitle` is for, and it is why `/stats` FR-009 does
  **not** carry over.

- **`routineKcal` is never filled in.** It is always `null` from the backend and
  the frontend does not estimate it, substitute `totalKcal`, or hide it. The
  card states the gap in a `text-xs text-text2` note so the missing series reads
  as a backend limitation rather than a frontend bug. If the backend ever
  estimates routine calories, this Spec changes.

- **Nullable numbers stay `null` all the way to the chart.** `best1RM`,
  `weightUsed`, `reps`, `deltaPct`, `slope`, `pctChange`, `lastTrainedAt` are
  never coerced to `0`. Coercion would erase the exact signal the backend
  encodes — `participated: false` means "no eligible set this week", and a `0`
  point would render it as "trained and lifted nothing".

- **Series caps live in the pure mapper.** Top 6 exercises for the 1RM line
  (ranked by participating weeks, ties broken by name so the selection is
  deterministic), top 8 + an `"Otros"` series for volume-by-exercise so the
  stacked total is preserved. Caps in a component would be untestable without a
  chart; in the mapper they are three exported pure helpers.

- **`INSUFFICIENT` trends are excluded from the bar.** Fewer than 3 weeks means
  `pctChange: null`; a zero-length bar would misread as "no change". Those
  entries appear only in the list, labeled "Sin datos suficientes".

- **Color roles are read differently for chart data and for badges.** `accent`
  (`#F5C623`) for deload weeks is sanctioned because it is already in
  `STATS_CHART_COLORS`. The four trend-label colors also reappear as **badges**,
  where `ui-conventions.md` §1 action roles apply: `UP`→`primary`,
  `FLAT`→`text2`, `DOWN`→`warning` (a non-blocking warning — `error` is reserved
  for destructive actions and error messages and is deliberately unused),
  `INSUFFICIENT`→`secondary` (informative). §6 treats a role violation as a bug,
  so the reasoning is recorded rather than assumed.

- **`LocalDate` gets one canonical home.** It is declared in five modules today.
  This feature adds `shared/interfaces/local-date.interface.ts` and turns
  `date.service.ts` into a re-export, so the ~10 existing importers from
  `date.service` keep compiling untouched while new code imports the canonical
  file. The three duplicates owned by the tracking feature are left alone —
  they belong to another spec. Because the alias is `string`, this is hygiene,
  not a breaking change.

- **`StatsInsightsService` is a new class beside `StatsService`, not an extension
  of it.** Six more getters would double `StatsService`'s surface and contradict
  the `/stats` spec's "four getters" contract. Both classes live in the existing
  `core/services/stats/` folder: the repo has one folder per **route group**
  (`exercises/`, `plans/`, `day-logs/`), and `/stats` is one route group.

- **New date helpers go into `DateService` and `date.utils.ts`, not into
  components.** `DateService` (injectable) owns `LocalDate` calendar math:
  `isValidLocalDate`, `daysBetween`, `lastNDays`, `isoWeekStartLocalDate`.
  `date.utils.ts` (pure) owns the API-boundary conversion
  `apiDateTimeToLocalDate`. That split is real and used here but was previously
  undocumented; `date-handling.md` (Phase 8) makes it canonical, including that
  display-only formatters live in `stats-chart.theme.ts` and should eventually
  move to a `format.utils.ts`.

- **The ISO week is derived, never computed from the range.** `weekKey` arrives
  from the backend. The frontend only parses it, for an axis label
  (`formatWeekKey`) and a tooltip date (`isoWeekStartLocalDate`), both defensive:
  a key that does not match `^\d{4}-W\d{1,2}$` is passed through untouched, and an
  unparseable week number yields `null` rather than a wrong date.

## Non-goals

- **No fix for the Workbox GraphQL cache growth (NFR-002).** `src/sw.js` caches
  every non-mutation query in IndexedDB keyed by
  `{ operationName, variables }` with no `maxEntries` and no expiration, so each
  explored range leaves six permanent records. The dead `GRAPHQL_WHITELIST` in
  `src/sw.js` would have allowed filtering. Changing that is a PWA change
  requiring `sdd/pwa-offline/spec.md`; it does not get smuggled in here.
- **No `REST` member added to the frontend `ExerciseCategory` enum.** The backend
  has 11 categories, the frontend 10. `getStatsForgottenMuscles` walks the whole
  catalog, so `rest` is the likely value to arrive untranslated — handled locally
  by keeping `ForgottenMuscleVM.muscle` a raw `string` with a translated `label`.
  Syncing the enum touches the exercises feature (its form dropdown and
  `sdd/exercises/spec.md`).
- **No migration of the four existing `app-input [type]="'date'"]` call sites.**
- **No offline persistence of results.** Read-only; BR-012 does not apply.
  Results live in signals for the lifetime of the route.
- **No pagination, no per-exercise filter UI.** The 120-day cap bounds every
  series to ~18 week buckets; the mapper caps series count instead.
- **No drill-down, no chart click handlers, no shared crosshair between charts.**
- **No relocation of the display formatters** out of `stats-chart.theme.ts`
  (recorded as a known boundary instead).
- **No fix for the self-contradicting docstring** on
  `DateService.localDateToDisplay` (line 58 says noon, line 62 says midnight),
  even though `app-input-date` depends on that function. Pre-existing; a
  one-line fix belongs in a change that touches it.

## Tasks (test-first, one at a time)

Each phase writes or updates its `*.spec.ts` **before** the implementation it
covers, and validates before moving on.

### Phase 0 — Spec and Plan (done)

- `sdd/stats-insights/spec.md` written.
- `sdd/README.md` index row; cross-reference in `sdd/stats/spec.md` `Context`.
- This Plan.

### Phase 1 — Canonical `LocalDate` and date helpers

- `shared/interfaces/local-date.interface.ts`: declare `LocalDate = string` with
  the BR-003 rationale docstring.
- `core/services/date.service.ts`: replace the declaration with a re-export
  (existing importers unaffected), then add `isValidLocalDate`, `daysBetween`,
  `lastNDays`, `isoWeekStartLocalDate` using `date-fns` /
  `date-fns-tz`. `isValidLocalDate` must reject real calendar impossibilities
  (`'2026-02-30'`, `'2026-13-01'`), not just the wrong shape.
- `shared/utils/date.utils.ts`: add `apiDateTimeToLocalDate`.
- Tests: **TEST-005** (`date.service.spec.ts`) and **TEST-006**
  (`date.utils.spec.ts`, pinning the zone with the established
  `Intl.DateTimeFormat.prototype.resolvedOptions` spy from
  `tracking.wrapper.spec.ts`).

### Phase 2 — Contracts and queries

- `shared/interfaces/api/stats-charts-api.interface.ts`: `StatsChartsInput` and
  the six API shapes exactly as the backend returns them.
- `shared/interfaces/stats-insights.interface.ts`: the six VM families,
  `LocalDateRange`, `StatsDateRangePreset`, the four range constants, the three
  mapper-cap constants, `StatsInsightsSection`.
- `core/apollo/stats-insights.queries.ts`: the six `gql` constants, each selecting
  **exactly** the fields the backend exposes — a missing field fails the whole
  query.
- No tests (constants and interfaces). `stats.interface.spec.ts` exists as
  precedent for asserting shapes; skip it here — the wrapper tests cover the
  contract that matters.

### Phase 3 — Mapping layer (pure, unit-tested)

- `shared/wrappers/stats-insights.wrapper.ts`: six API→VM functions.
  `category.toLowerCase()` with an `'unknown'` fallback (BR-004); `muscle`
  verbatim + `label` translated; `lastTrainedAt` ISO → `LocalDate` via
  `apiDateTimeToLocalDate`; every nullable numeric kept `null`; non-null metrics
  rounded (kg 1 decimal, percentages integer) with `Intl.NumberFormat('es-ES')`;
  `label` narrowed to `TrendLabelVM` with an `'INSUFFICIENT'` fallback for an
  unknown value. No mutation of inputs.
- `shared/utils/stats-chart.theme.ts`: add `WEEKLY_CHART_HEIGHT`,
  `MULTI_SERIES_CHART_HEIGHT`, `DIVERGING_BAR_CHART_HEIGHT`,
  `TREND_LABEL_COLORS`, `DELOAD_POINT_COLOR`, `formatWeekKey`, `formatKcal`,
  `formatSignedPercent`. Everything existing is reused unchanged.
- `shared/utils/stats-insights-chart.mapper.ts`: the seven builders plus
  `selectTop1RmExercises`, `selectTopVolumeExercises`, `weekCategories`. Pure,
  no input mutation, `null` on empty input.
- Tests: **TEST-007**, **TEST-009**, **TEST-010**, **TEST-011**..**TEST-017**.

### Phase 4 — Service and State

- `core/services/stats/stats-insights.service.ts`: six one-liner getters mirroring
  `StatsService` — `apollo.query` with `variables: { input }`,
  `fetchPolicy: 'network-only'`, `handleGraphqlError`, then the wrapper. No
  `forkJoin`, no optional legs (unlike `/stats`'s `getTopRoutines`).
- `core/services/stats/stats-insights.state.ts`: `from`/`to`/`timezone` signals;
  one `BehaviorSubject<StatsInsightsQueryInput>` per section through `switchMap`;
  `load()`, `applyRange(range)`, `retry(section)`.
- Tests: **TEST-008**, **TEST-018**, **TEST-019**.

### Phase 5 — Shared UI

- `shared/components/ui/input-date/`: implement the stub per FR-005. Plain
  `@for` month grid from `date-fns` on display-only `Date`s, converted back to
  `LocalDate` strings before any comparison or emission (BR-003). Popover on
  `bg-background1`, cells on `bg-background2`, selected/today on `primary` /
  `primaryDark`, weekday header `text-text2 text-xs`, day numbers `text-text3`,
  `rounded-xl` shell / `rounded-lg` cells, padding from the §2 scale, no new
  colors. `aria-expanded` on the trigger, `aria-label` on the grid, disabled
  days not focusable. It never writes to `control` on its own.
- `shared/components/widgets/stats/stats-date-range/`: implement the stub per
  FR-006. Two `app-input-date`, a preset row of `app-btn`s, an internal
  `FormGroup` with a `maxDays` group validator, `rangeChange` / `rangeInvalid`.
  Injects `DateService` for `lastNDays`.
- `shared/components/ui/stats/stats-section/`: add `refreshing` and `subtitle`
  inputs. `refreshing` renders `app-loading` beside the `<h2>` and never
  replaces `<ng-content>`; precedence stays `loading` → `error` → `empty` →
  content.
- Tests: **TEST-001**, **TEST-002**, **TEST-003**, **TEST-004**, **TEST-020**.

### Phase 6 — Page and navigation

- `src/app/pages/stats/stats.routes.ts`: `STATS_ROUTES` with `''` → `StatsPage`
  and `'insights'` → `StatsInsightsPage`, both lazy.
- `src/app/app.routes.ts`: `stats` → `loadChildren` + `canActivate: [authGuard]`.
- `src/app/pages/stats/stats.html`: entry `app-btn` in the hero.
- `src/app/pages/stats/stats-insights/stats-insights.{ts,html}`: the thin
  orchestrator — 6 sections, `sectionEmpty` / `sectionRefreshing` helpers reused
  from `/stats`, back `app-text-link`, global error notification, the two `<ul>`
  detail lists, and the calories note.
- Tests: **TEST-021**, **TEST-022**.

### Phase 7 — Validation and documentation

- Run the gates below. — **done**: 676 SUCCESS, lint/typecheck/build pass.
- Visual pass on an authenticated `/stats/insights` (the only check that proves
  NFR-004 containment and NFR-005 label rotation across 7 charts). —
  **not done**, see `Status`; it needs a real session.
- `documents/engineering/date-handling.md` (new) + its `README.md` row. — **done**
- `documents/design/ui-conventions.md` §1: add the missing `bg-background1`
  (`#151A16`) and `bg-background5` (`#367C4D`) rows. — **done**
- `documents/design/ui-components.md` §3: add `app-input-date`, note that it
  does not replace `app-input [type]="'date'"]` yet. — **done**
- `documents/engineering/architecture.md` §3 folder tree and §5 service table. —
  **done**
- `sdd/stats/spec.md`: correct FR-001 and the Architecture tree for the route
  restructuring (Correction 7). — **done**
- `sdd/stats-insights/spec.md`: annotate each `TEST-xxx` with ✅ and its spec file,
  matching how `sdd/stats/spec.md` marks delivered tests. — **done**, plus
  Correction 8 (`dd/MM/yyyy` vs `toDisplayString()`) and the AC-005 refetch note.
- `documents/reports/stats-charts-range.md` (new) once delivered. — **done**

## Validation

- `npm run lint`
- `npm run typecheck`
- `npm run test:ci` — full Karma/Jasmine suite green (repeat `--include` per
  spec; a comma-separated list does not work, and two `ng test` processes cannot
  run in parallel on the fixed Karma port).
- `npm run build` — exit 0; note the pre-existing initial-budget **warning**
  (854 kB vs `maximumWarning: 500kB`, below the 1 MB error threshold) and that
  `highcharts` must remain a lazy chunk.
- `npx prettier --check` on the touched files only — repo-wide there is
  pre-existing debt (138 files on `format:check`, 225 on `.`) that this change
  neither creates nor fixes.
- **Visual pass on an authenticated `/stats/insights`** — 6 cards, 7 charts, first
  skeleton then inline spinner with the previous chart kept, range change,
  invalid-range message, one section failing while the other five render, and
  no chart past its card. Required: two defects on this branch were found only by
  looking at the page, and the e2e suite cannot help because
  `e2e/auth.setup.ts` uses placeholder credentials.

## Backend coordination

The `wave-fit-api` side is **already deployed**; there are no mutations and no
write-path coupling. The remaining coupling is read-only:

- The six field selections must match the schema exactly. A field the backend
  does not return fails the whole query.
- The 120-day boundary (see Decisions) is the one open question. It does not
  block any task.
- `getStatsForgottenMuscles` can return the backend-only `REST` category, which
  the frontend enum lacks — handled locally, but it is the clearest evidence that
  the two enums have drifted.
