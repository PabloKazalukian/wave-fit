# Stats Insights (Estadísticas dinámicas por rango de fechas)

## Context

`/stats/insights` is a **read-only** analytics page that answers _"how did my
training change between these two dates?"_. The user picks a date range and the
page aggregates the backend's raw training history **on demand** for six
different lenses. Nothing is pre-computed, nothing is persisted.

It is a **different feature** from `/stats`, not an extension of it:

|             | `/stats` (see [stats](../stats/spec.md))               | `/stats/insights` (this spec)                           |
| ----------- | ------------------------------------------------------ | ------------------------------------------------------- |
| Data origin | Worker snapshots pre-computed at training checkpoints  | On-demand aggregation at query time                     |
| Queries     | 4, **unparameterized**, worker-facing getters excluded | 6, all sharing one `StatsChartsInput`                   |
| Input       | none (whole history)                                   | `{ from, to, timezone? }` chosen by the user            |
| Freshness   | `computedAt` timestamp of the snapshot                 | Live result of the current range                        |
| Granularity | Ranking + weekly adherence                             | Weekly buckets per exercise / muscle / total / calories |

Both pages share the Highcharts theme (`shared/utils/stats-chart.theme.ts`), the
card shell (`app-stats-section`) and the chart wrapper (`app-stats-chart`). The
`/stats` page owns a button that navigates here (FR-002).

### Contract (backend `wave-fit-api`, already deployed)

6 queries, 0 mutations, all `GqlAuthGuard` (`Authorization: Bearer <token>`),
all with the same input:

```graphql
input StatsChartsInput {
    from: String! # "yyyy-MM-dd"
    to: String! # "yyyy-MM-dd"
    timezone: String # optional, default "America/Argentina/Buenos_Aires"
}
```

Backend validation (`BadRequestException`): dates are valid `yyyy-MM-dd`,
`from <= to`, range `<= 120` days. `weekKey` is an ISO week (`"2026-W40"`).

Queries: `getStats1RmWeekly`, `getStatsVolumeWeekly`, `getStatsVolumeTotalWeekly`,
`getStatsCaloriesWeekly`, `getStatsForgottenMuscles`, `getStatsExerciseTrend`.
Shared enums: `ExerciseCategory` (backend has a `REST` member the frontend enum
lacks — see Known issues) and `TrendLabel` (`UP | FLAT | DOWN | INSUFFICIENT`).

### Existing assets reused (no new runtime dependency)

- **Highcharts v12** + **highcharts-angular v5**, with `provideHighcharts()`
  already registered in `src/app/app.config.ts`. All chart types (`line`,
  `column`, `bar`) ship in the full `highcharts` package.
- **date-fns 4.1.0** + **date-fns-tz 3.2.0**, already direct dependencies.
- `app-stats-section` (card shell), `app-stats-chart`, `app-btn`,
  `app-notification`, `app-text-link`, `app-loading`, `exerciseCategory` pipe.
- `DateService` (`core/services/date.service.ts`) as the owner of `LocalDate`
  calendar math, and `shared/utils/date.utils.ts` for pure conversions.

### Components already scaffolded (Angular 20 stubs, to be implemented)

```bash
ng g c shared/components/ui/input-date              # app-input-date     / InputDate
ng g c shared/components/widgets/stats/stats-date-range  # app-stats-date-range / StatsDateRange
```

Both are CLI stubs (empty class, `<p>…works!</p>` template). This spec defines
their contracts (FR-005, FR-006). Names, paths and class names are final and
match the repo conventions:

- `app-input-date` / `InputDate` at `shared/components/ui/input-date/` — a
  generic form control in `ui/`, sibling of `app-input-number` / `InputNumber`
  and `app-input-search` / `InputSearch`, which use the same prefix-dropped
  naming. **No rename needed.**
- `app-stats-date-range` / `StatsDateRange` at
  `shared/components/widgets/stats/stats-date-range/` — a feature-prefixed
  widget, matching its sibling `app-stats-chart` at
  `shared/components/widgets/stats/stats-chart/`. Satisfies
  `coding-standards.md` §7.1 (the page composes widgets, it defines none).

### Corrections applied against the initial exploration

| #   | Correction                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `stats-date-range` lives at `widgets/stats/stats-date-range/` (the CLI default, and what already shipped), **not** `widgets/stats/date-range/` — it must mirror `widgets/stats/stats-chart/`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2   | The calendar popover was split out of the range widget into the generic `ui/input-date`. A date picker is reusable app-wide; the _range_ (two coupled dates + presets + a 120-day cap) is stats-specific.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 3   | `ui-conventions.md` §1 background table is **missing** `bg-background1` (`#151A16`) and `bg-background5` (`#367C4D`), both of which exist in `tailwind.config.js` and are used by the calendar. Corrected in the documentation update (FR-021).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 4   | The Tailwind `safelist` does **not** contain `bg-background1..4`. No change is needed: the new templates use **literal** class names, which Tailwind collects through `content: ['./src/**/*.{html,ts}']`. The safelist only matters for dynamically-built names (as `btn.ts` does).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 5   | `app-input`'s `type: 'date'` is **not** removed by this feature — replacing it would touch the profile, strength-metrics, weight and coach form templates (cross-feature churn). See Known issues.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 6   | `ForgottenMuscleVM.muscle` is typed `string`, **not** `StatsCategory`: `getStatsForgottenMuscles` walks the whole `ExerciseCategory` catalog, so it is the query most likely to return the backend-only `REST` member. A translated `label` is precomputed in the wrapper.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 7   | The `/stats` spec's **FR-001** ("`/stats` is a top-level route … loaded lazily") and its **Architecture** tree become factually wrong once `/stats` becomes a `loadChildren` parent: the route is still top-level and still `authGuard`-protected, but `''` becomes a child route and the dashboard is one of two siblings. That Spec is corrected in the same change scope, at validation time — the same precedent this Spec's `/stats` sibling set when it removed `/user/trackings/stats`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 9   | The page's flow is **chained and user-initiated**, not eager. FR-004 ("on first load the page uses…"), FR-008 ("re-runs **all six** getters"), FR-020 ("renders **six** cards"), AC-002 and AC-005 all described the delivered first version, which queried six unparameterized-by-metric queries the moment the route resolved. The requested flow is: pick **one** metric → pick a range → press **"Ver gráficas"** → exactly **one** section is queried and **one** card renders. FR-004, FR-008, FR-020, AC-002, AC-005, TEST-018 and TEST-021 are amended in place by FR-022/FR-023/FR-024; the six queries, the six card shapes and every mapper are **unchanged**. Only _when_ and _which_ section is fetched changes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 10  | The calendar day hover uses `accent` at 70% (`bg-accent/70`), which `ui-conventions.md` §1 reserves for new/alternative/free features and forbids as a page-level action color. The reservation is **amended**, not overridden: the exception is scoped to `_hover state on a day cell in the app-input-date month grid_` — a transient affordance on a control already inside the popover, not a CTA. It is not an action color, carries no meaning of its own, and is never used on a page, button, or chart. Recorded here and in `ui-conventions.md` §1 so the §6 role check has an explicit entry to match rather than flagging it as a violation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 11  | The feature was specced as `stats-charts` and is **renamed `stats-insights`**, because "charts" named only one of its six lenses (FR-020/FR-022: one metric is picked at a time) while the page is really the range-parameterized analytics view that "charts" merely renders. This is a **pure rename**: not one requirement, contract, query, card shape, mapper, threshold or acceptance criterion changes. Renamed: the Spec folder `sdd/stats-insights/`, the route `/stats/charts` → `/stats/insights` (child `charts` → `insights`), `StatsChartsPage`/`StatsChartsService`/`StatsChartsState`/`StatsChartsSection`/`StatsChartsMetricOption`/`StatsChartsSectionData`/`StatsChartsSectionEntry` → `StatsInsights…`, the local alias `StatsChartsQueryInput` → `StatsInsightsQueryInput`, the seven `STATS_CHARTS_*` constants → `STATS_INSIGHTS_*`, the selectors `app-stats-charts-page`/`-controls`/`-card` → `app-stats-insights-page`/`-controls`/`-card`, and every `stats-charts.*` path under `core/`, `pages/` and `shared/`. **Deliberately NOT renamed** (see Known issues): `StatsChartsInput`, the `stats-charts` GraphQL namespace and `stats-charts.resolver.ts`, the six query names, and `shared/interfaces/api/stats-charts-api.interface.ts` — those belong to the deployed `wave-fit-api` contract, which the frontend does not own; and `feat/stats-charts`, the branch, which keeps its name. Renaming a deployed contract would be a coordinated backend change, not a frontend refactor. |

## Requirements

### FR: Functionality

- **FR-001 Route.** `/stats` becomes a `loadChildren` route
  (`STATS_ROUTES` in `src/app/pages/stats/stats.routes.ts`) with two children:
  `''` → the existing `StatsPage`, `'insights'` → the new `StatsInsightsPage`.
  Both are lazy (`loadComponent`) and the parent carries
  `canActivate: [authGuard]` (BR-005). `/stats/insights` is a child of `/stats`,
  not a flat sibling path.
- **FR-002 Entry and exit navigation.** The `/stats` hero gains an `app-btn`
  (`variant: 'raised'`, `size: 'md'`, `color: 'primary'`, `showIcon: true`,
  `routerLink: '/stats/insights'`, text "Explorar por rango de fechas") and the
  new page renders an `app-text-link` back to `/stats` ("Volver a Mis
  Estadísticas"). The header needs **no** change: `isActive()` compares with
  `startsWith`, so `/stats/insights` keeps the `/stats` entry highlighted.
- **FR-003 Service.** `StatsInsightsService`
  (`core/services/stats/stats-insights.service.ts`) exposes exactly six public
  getters — `getOneRmWeekly`, `getVolumeWeekly`, `getVolumeTotalWeekly`,
  `getCaloriesWeekly`, `getForgottenMuscles`, `getExerciseTrend` — each taking
  a `StatsInsightsQueryInput` and returning `Observable<…VM[]>`. Every getter runs
  `fetchPolicy: 'network-only'` (NFR-001), sends
  `variables: { input: { from, to, timezone } }`, normalizes failures through
  `handleGraphqlError(AuthService)` and maps its payload through the matching
  wrapper.
- **FR-004 Default range and timezone (amended by FR-023).** The controls open on
  the **last 30 calendar days ending today** in the user's timezone
  (`DateService.lastNDays(30, timezone)`). `timezone` comes from
  `DateService.getUserTimezone()` and is sent on **every** query, including the
  first. `from`/`to` are always `LocalDate` (`"yyyy-MM-dd"`), never `Date`
  (BR-003). What changed: this range is the **prefilled pending value**, not a
  query trigger — nothing is requested until the user presses "Ver gráficas"
  (FR-023).
- **FR-005 `app-input-date` (generic control).** Renders the bound `LocalDate`
  in `dd/MM/yyyy` and opens a **month calendar popover** on click/tap. It binds a
  `FormControl` like every other form control
  (`ui-components.md` §3) and owns its own label, error message and validation
  styling.

    ```ts
    control = input.required<FormControl<LocalDate | null>>();
    label = input<string>('');
    placeholder = input<string>('dd/mm/aaaa');
    min = input<LocalDate | null>(null); // days before `min` are disabled
    max = input<LocalDate | null>(null); // days after `max` are disabled
    isDisabled = input<boolean>(false);
    dateChange = output<LocalDate>(); // only on a real user selection
    ```

    Behavior: the popover toggles on the trigger, closes on `Escape`, on outside
    click and on selection; the month grid is Monday-first with Spanish weekday
    and month names (the convention already hardcoded in
    `app-training-history-calendar`); `today` and the selected day are
    distinguished; disabled days are not selectable; the control never writes to
    `control` on its own — only `dateChange` propagates upward and the host
    decides to `control.setValue(...)`. Styling uses only tokens from
    `ui-conventions.md` §1 — the popover shell on `bg-background1`, the grid cells
    on `bg-background2`, the selected day and today on `primary` /
    `primaryDark`, the weekday header in `text-text2` (`text-xs`), the day numbers
    in `text-text3`, radius `rounded-xl` for the shell and `rounded-lg` for the
    cells, padding from the §2 scale. **No new colors.**

- **FR-006 `app-stats-date-range` (widget).** Composes **two** `app-input-date`
  plus a preset row, owns its internal `FormGroup`
  (`{ from, to }`, both `FormControl<LocalDate | null>`) and never leaks
  ReactiveForms into the page (§7.1).

    ```ts
    from = input.required<LocalDate>();
    to = input.required<LocalDate>();
    maxDays = input<number>(STATS_INSIGHTS_MAX_RANGE_DAYS); // 120
    presets = input<StatsDateRangePreset[]>(STATS_INSIGHTS_RANGE_PRESETS);
    isDisabled = input<boolean>(false);
    rangeChange = output<LocalDateRange>(); // emitted only when valid
    rangeInvalid = output<string | null>(); // Spanish message, or null
    ```

    Presets: `7`, `30`, `90` and `120` days, labeled "Últimos 7 / 30 / 90 / 120
    días"; a preset click resolves `from = today - (days - 1)`, `to = today`
    through `DateService` and emits `rangeChange`. The two inputs are
    cross-constrained: picking a `from` after the current `to` pushes `to` forward
    (and vice versa) rather than invalidating, while a span over `maxDays` does
    invalidate, because there is no sensible silent correction for it.

- **FR-007 Client-side range validation mirrors the backend.** Before any query
  runs, the widget rejects — with a `text-xs text-error` inline message and
  **without** emitting `rangeChange` — a missing `from`/`to`, a value that is not
  a valid `yyyy-MM-dd` calendar date (`DateService.isValidLocalDate`), and a span
  where `differenceInCalendarDays(to, from) > maxDays`. The message names the
  limit ("El rango no puede superar los 120 días"). An out-of-order `from` is
  **not** a rejection case: FR-006 corrects it before this rule applies, so the
  span seen here is already ordered. This exists to give inline feedback instead
  of a `BadRequest` round-trip; the backend remains authoritative and its
  rejection surfaces through the section's error card (FR-011).
- **FR-008 Refetch on range change, with cancellation.** Emitting `rangeChange`
  re-runs **all six** getters with the new input. In-flight requests for the
  previous range are **cancelled** so a slow response cannot overwrite a newer
  one — the state drives each section from a single `BehaviorSubject<StatsInsightsQueryInput>`
  through `switchMap`, which makes the cancellation structural rather than
  bookkeeping. `timezone` is preserved across range changes.
- **FR-009 Two distinct loading states.** First load → **skeleton** mirroring
  the card shell (`bg-background2 rounded-2xl`, inner `bg-background3
rounded-xl`, `animate-pulse`, `aria-busy`), per `ui-components.md` §1.
  Range change with data already on screen → **`refreshing`**: an inline
  `app-loading` (`color: 'primary'`, `size: 'sm'`) in the section header while
  the **previous chart stays visible**. To support this, `app-stats-section`
  gains one input, `refreshing = input(false)`, which renders the spinner
  **beside** the `<h2>` and never replaces `<ng-content>`. Precedence stays
  `loading` → `error` → `empty` → content, so a refreshing section with an
  error still shows the error card.
- **FR-010 Section independence.** The six sections load in parallel and are
  independent: a failing, slow or empty section never blocks, delays or resets
  the others. This mirrors FR-003 of the `/stats` spec.
- **FR-011 Error, retry and global notification.** A failed section shows the
  error card with "Reintentar", which re-runs **only that section** with the
  **current** range. Any section error also raises **one** global
  `app-notification` (`type: 'error'`, `duration: 4000`), dismissible without
  touching the cards.
- **FR-012 1RM weekly per exercise.** `getStats1RmWeekly` → a **`line`** chart:
  x-axis = `weekKey`, one series per exercise (`best1RM`, kg). The mapper keeps
  the **6** exercises with the most participating weeks
  (`STATS_INSIGHTS_MAX_1RM_SERIES`); ties break by `name` so the selection is
  deterministic. `connectNulls: false` so a week with no eligible set renders as
  a **gap**, which is the semantic the backend encodes through
  `participated: false`. Legend is **enabled** for this chart only (the base
  theme disables it). Tooltip: exercise name, `best1RM`, and the underlying
  `weightUsed` × `reps`.
- **FR-013 Weekly volume by exercise and by muscle.** `getStatsVolumeWeekly` →
  **one card, two stacked `column` charts**: x-axis = `weekKey`, series =
  exercises (kept **8** by total volume in the range plus an `"Otros"` series
  that aggregates the rest, so the stacked total is preserved) and series =
  muscles (one per muscle, no cap needed — the catalog is 11 members). The cap
  and the `Otros` aggregation live in the pure mapper, never in the template.
  `ExtraSession` contributes no volume (backend behavior); nothing in the
  frontend adds it.
- **FR-014 Weekly total volume and deload.** `getStatsVolumeTotalWeekly` → a
  **`column`** chart of `totalVolume` per week, in `primary`. Weeks with
  `possibleDeload: true` are colored **`accent` (`#F5C623`)**. Tooltip: total
  volume and `deltaPct` against the previous week in the series, shown as
  "—" when `null` (previous week absent or zero).
- **FR-015 Weekly calories.** `getStatsCaloriesWeekly` → a **`column`** chart of
  `extraKcal` per week. `routineKcal` is **always `null`**: the frontend never
  plots it, never substitutes `totalKcal` for it and never estimates it. The
  card shows an explicit `text-xs text-text2` note ("Las calorías de rutina no
  están calculadas por el servidor; solo se muestran sesiones extra"), so the
  empty-looking series reads as a backend gap rather than a frontend bug.
  Tooltip: `extraKcal` (kcal) and `estimatedSessions`.
- **FR-016 Forgotten muscles.** `getStatsForgottenMuscles` → a **horizontal
  `bar`** chart of `totalSets` (labels on the y-axis, so `marginBottom: 0` and
  no rotation) **plus** a `<ul>` list mirroring the "Récords personales" pattern
  on `/stats`: muscle `label`, `weeksWithoutWork` and `lastTrainedAt` (or "Nunca").
  The backend's severity order (`totalSets` asc, `weeksWithoutWork` desc,
  `lastTrainedAt` asc) is preserved as-is — the mapper does not re-rank. Only
  muscles **below** the threshold come back, so an empty payload is a _good_
  state: "¡Todos los músculos están al día!".
- **FR-017 Exercise trend.** `getStatsExerciseTrend` → a **diverging `bar`**
  chart of `pctChange` on a **symmetric** x-axis (`min: -m`, `max: +m`, `m` the
  next multiple of 10 above the largest absolute value), colored per `label`:
  `UP` → `primary`, `FLAT` → `text2`, `DOWN` → `warning`, `INSUFFICIENT` →
  `secondary`. `INSUFFICIENT` entries (fewer than 3 weeks, `pctChange: null`)
  are **excluded from the bar** — a zero-length bar would misread as "no change"
  — and surface only in the companion `<ul>`, which lists name, `label` badge,
  `slope`, `weeksUsed` and "Sin datos suficientes" instead of a percentage.
- **FR-018 Week labels.** x-axis categories are `formatWeekKey(weekKey)`, i.e.
  `"2026-W40"` → `"W40"` — short enough that no rotation is needed
  (`xAxis.labels.rotation: 0`, opting out of the base theme's −45°). Each
  tooltip header shows the full key plus the ISO week's Monday, derived by
  `DateService.isoWeekStartLocalDate(weekKey)` (`"Semana 2026-W40 · lun
29/09"`). Both functions are defensive: a key that does not match
  `^\d{4}-W\d{1,2}$` is returned untouched, and an unparseable week number
  yields `null` rather than a wrong date.
- **FR-019 Category and muscle normalization.** `category` arrives UPPERCASE and
  is normalized with `toLowerCase()` in the wrapper (BR-004); unknown values map
  to `'unknown'` exactly as on `/stats`. `muscle` keeps the raw lowercase value
  **and** gets a translated `label` (Correction 6). Display of both goes
  through the existing `exerciseCategory` pipe / `ForgottenMuscleVM.label`.
- **FR-020 The page is a thin orchestrator (amended by FR-023, FR-024).**
  `StatsInsightsPage` owns no query, no persistence and no chart-building logic: it
  reads `StatsInsightsState` signals, maps VM → `Highcharts.Options` through the
  pure mappers, and renders `app-stats-insights-controls` plus the
  **one** `app-stats-insights-card` for the selected section. Six sections still
  ⇒ six `computed` option signals (they are what makes the chart-type work of a
  later change a one-liner per section), but only the selected section's card is
  instantiated. `load()` is gone from the constructor and the `card()` factory's
  state derivation moved into `app-stats-insights-card` (FR-024).
- **FR-021 Documentation corrections.** After validation: add the
  `bg-background1` / `bg-background5` rows missing from `ui-conventions.md` §1;
  add `app-input-date` to the form-controls table in `ui-components.md` §3;
  create `documents/engineering/date-handling.md` (`LocalDate`, the two date
  modules, timezone resolution, the ISO-week rule, the test helper for pinning a
  zone) and register it in `documents/engineering/README.md`; add the
  `stats-insights` entries to `documents/engineering/architecture.md` §3 and §5;
  and correct `sdd/stats/spec.md` FR-001 + Architecture for the route
  restructuring (Correction 7).
- **FR-022 `app-stats-insights-controls` (the chained flow).** A new widget at
  `shared/components/widgets/stats/stats-insights-controls/`, sibling of
  `app-stats-date-range`, that owns the input chain in a fixed vertical order —
  (1) **what to plot**, (2) **which range**, (3) **"Ver gráficas"**. It composes
  `app-select` and the existing `app-stats-date-range`, and it **queries nothing**:
  no `StatsInsightsState` reference, no `Apollo`, no subscription.

    ```ts
    options = input.required<readonly StatsInsightsMetricOption[]>();
    from = input.required<LocalDate>();
    to = input.required<LocalDate>();
    isRunning = input<boolean>(false); // any visible section in flight
    run = output<{ section: StatsInsightsSection; range: LocalDateRange }>();
    ```

    Step 1 is a **single**-choice `app-select` whose `value` is a
    `StatsInsightsSection`; with no metric selected the button is `isDisabled`.
    Step 2 is the **unmodified** `app-stats-date-range`: its `rangeChange` updates
    a pending range **local to this widget** and emits nothing, so editing a date
    never queries. Step 3 is `app-btn` (`variant: 'raised'`, `color: 'primary'`,
    text "Ver gráficas") with a projected `app-spinner` while `isRunning`.
    `[from]`/`[to]` are the seed only (FR-004); the widget's own pending range is
    authoritative from then on, and the page reflects nothing back — otherwise a
    parent write would overwrite what the user is editing.

    `StatsInsightsMetricOption` is `{ section: StatsInsightsSection; label: string }`
    in `shared/interfaces/stats-insights.interface.ts`, in product language. It is
    the **same six strings** the card titles use, so the dropdown and the card
    header cannot drift.

- **FR-023 Explicit run; no query on route entry (amends FR-004 and FR-008).**
  Entering `/stats/insights` fires **zero** requests. `StatsInsightsState` drops
  `load()`, and `applyRange(range)` is replaced by `run(section, range)`, which
  `next()`s **only that section's** `BehaviorSubject<StatsInsightsQueryInput>`.
  The other five triggers are untouched, so their getters are never called.

    The six per-section subjects are still constructed in the state constructor:
    that is what keeps "zero requests on entry" true without special-casing. Each
    starts on `null` and `switchMap` maps `null` to `EMPTY` (an existing guard),
    so a constructed subject emits nothing until a real input arrives.

    Cancellation is **preserved** — FR-008's substance survives, only its trigger
    changes. `run` is a `switchMap` `next()` per section, so a second press while
    a request is in flight still discards the superseded response structurally.
    Pressing "Ver gráficas" again for the same metric is a refetch that keeps the
    previous chart on screen (`refreshing`, FR-009); pressing it for a different
    metric is a different card whose first load is a skeleton.

    The page owns `selected: StatsInsightsSection | null` and the pending range.
    `selected` is what a `visibleCards` `computed` filters on, so the page never
    renders a card for a section the user did not choose.

- **FR-024 `app-stats-insights-card` (one child per section).** Each card becomes
  its own component at
  `shared/components/widgets/stats/stats-insights-card/`, wrapping
  `app-stats-section`. It is the unit that will carry the per-card interactions
  (which charts to show, which chart type) later, without touching the page.

    ```ts
    title = input<string>('');
    subtitle = input<string | null>(null);
    emptyMessage = input<string>('');
    charts = input.required<readonly Signal<Options | null>[]>();
    loading = input<boolean>(false); // raw entry flag, from the state
    hasData = input<boolean>(false);
    error = input<string | null>(null);
    retry = output<void>();
    ```

    `charts` is an array of **signals**, not an array of values, so the card
    re-renders when a mapper result changes without the page rebuilding an array
    on every render. That is also why `volume` (FR-013, two charts) stays **one**
    card with two charts instead of being split: the granularity is the section,
    which is simultaneously the query's granularity and the granularity of
    `loading` / `error` / `empty`.

    The component derives the two display flags rather than storing them, because
    the page used to derive them per card and that is the duplication this
    extraction removes:

    ```ts
    loading = computed(() => this.loading() && !this.hasData());
    refreshing = computed(() => this.loading() && this.hasData());
    ```

    Deriving rather than receiving `loading` is what keeps AC-005 satisfied: a
    refetch must never fall back to the skeleton and hide the previous chart.
    `empty` stays an input because it depends on the mapped `Options`, which only
    the page has. `app-stats-section` is **unchanged** by this FR — the new
    component composes it.

    Section-specific extras (the `routineKcal` note of FR-015, the two `<ul>`
    lists of FR-016/FR-017) are projected through a named slot,
    `<ng-content select="[cardExtras]">`, rendered only in the content branch.
    The page keeps the `@switch` that decides which extras a section gets; only
    the shell moved.

- **FR-025 Calendar day hover.** Every enabled day cell in the `app-input-date`
  month grid gets `bg-accent/70` on hover, with `transition-colors`. The
  **selected** day does not change on hover (its fill is the user's current
  value and must stay readable), and a `disabled` day does not hover either:
  Tailwind applies `:hover` to `<button disabled>` in some browsers, so the
  disabled rule also carries `disabled:hover:bg-transparent` to keep a blocked
  day from looking selectable. See Correction 10 for why `accent` is allowed
  here despite the §1 reservation.

### BR

- `BR-003` applies: `from`, `to`, `lastTrainedAt` and every derived calendar
  date are `LocalDate` strings (`"yyyy-MM-dd"`), never JS `Date`. Date
  comparisons are string comparisons; the only `Date` objects in this feature
  are display-only inside `app-input-date`.
- `BR-004` applies: `category` is UPPERCASE at the API boundary and lowercased
  in the wrapper.
- `BR-005` applies: `/stats/insights` is protected by `authGuard`, inherited from
  the `/stats` parent route.
- `BR-012` (offline-first writes) is **not** applicable: this feature is
  read-only. It does not write, queue or persist anything.

### NFR

- **NFR-001** All six queries run `network-only` and the page keeps **no** local
  persistence: no state serialization, no IndexedDB writes, no `localStorage`.
  Results live in signals for the lifetime of the route.
- **NFR-002 (risk, accepted).** The Workbox service worker caches **every**
  non-mutation GraphQL query in IndexedDB (`WaveFitDB` / `graphqlCache`) keyed
  by `JSON.stringify({ operationName, variables })`, with **no `maxEntries` and
  no expiration** (`pwa.md` §4.4). Every distinct range the user explores
  therefore leaves six permanent records behind. This feature multiplies the
  growth rate of an existing problem. No mitigation ships here — the SW cache is
  PWA behavior, out of this spec's scope, and the `GRAPHQL_WHITELIST` constant
  in `src/sw.js` that would have allowed filtering is dead code. Recorded in
  Known issues with the concrete follow-up.
- **NFR-003** Charts reuse `withStatsTheme` and `STATS_CHART_COLORS` unchanged.
  Highcharts credits stay disabled. **No new colors** are introduced in charts
  (FR-005, Correction 3); the one new color usage is the calendar hover of
  FR-025, `accent` at 70%, which reuses an existing token (Correction 10).
  Note the split this relies on: the four `label` colors are read
  as **data** colors from the sanctioned chart palette, while the same four
  colors reappear as **badges** in the trend list, where the §1 action roles
  apply — `UP` → `primary` (positive/brand), `FLAT` → `text2` (neutral),
  `DOWN` → `warning` (non-blocking warning; `error` is reserved for destructive
  actions and error messages and is deliberately **not** used), `INSUFFICIENT` →
  `secondary` (informative). Deload weeks use `accent`, which is already part of
  `STATS_CHART_COLORS`.
- **NFR-004** Every chart renders **inside** its card: the `<highcharts-chart>`
  host is block-level with `width: 100%` (already in `src/styles.css`
  `@layer base` from the `/stats` NFR-004 fix). The page container is
  `max-w-2xl`, identical to `/stats`, so both stats pages measure their charts
  the same way; sibling cards share `p-5`, `max-w` and `rounded-2xl`.
- **NFR-005** The base theme's −45° rotation applies to long exercise / muscle
  names only. `W##` week labels opt out with `rotation: 0`; horizontal `bar`
  charts move the labels to the y-axis and use `marginBottom: 0`. The only
  charts that keep long rotated labels are the exercise/muscle-name ones.
- **NFR-006** The payloads are bounded by the 120-day cap: at most ~18 ISO-week
  buckets per series. No pagination, no infinite scroll, no server-side
  filtering beyond the range.
- **NFR-007** Skeletons mirror the shell and radius of the content they replace
  (`ui-components.md` §1). A `refreshing` section shows a spinner **only** —
  it never replaces the chart, so reading the previous range during a refetch is
  the intended experience.
- **NFR-008** No new runtime dependency. `date-fns`, `date-fns-tz`, `highcharts`
  and `highcharts-angular` are already direct dependencies; the calendar grid is
  plain `@for` over computed day cells, not a datepicker library.
- **NFR-009** Semantic templates: `<section>` per card, `<header>` inside the
  card, `<ul>/<li>` for the two lists, `aria-label` on the icon-only trigger and
  on the skeleton, `aria-expanded` on the calendar trigger, `role="alert"` on the
  error card. The calendar grid is a table-free `<div>` grid with
  `aria-hidden` decorative cells excluded from the tab order.
- **NFR-010** `StatsInsightsPage` stays under ~200 lines of TypeScript and its
  template under ~120 lines, measured against the ~350-line pages that motivated
  §7.1. FR-022 and FR-024 tighten this rather than stretching it: the chained
  flow moves the controls into a widget and the card derivation into a widget,
  so the page should come out **shorter** than the first version even though it
  gained a third child component.
- **NFR-011 The chained flow never queries speculatively.** Only the `run` output
  of `app-stats-insights-controls` reaches the state. Changing the metric select or
  any date issues no request, so a user comparing six metrics over four presets
  pays for the combinations they actually opened. This is the practical half of
  NFR-002 (the accepted Workbox cache-growth risk): one record per
  `{section, range}` the user actually viewed, not six per page visit.

## Constraints

- **Read-only**: no create/edit/delete, no persistence, no sync-queue interplay
  (BR-012 does not apply).
- All six queries are **parameterized** and share one input type. Their field
  selections must match the backend schema **exactly** — a field the backend
  does not return fails the whole query — so deployment must be coordinated with
  `wave-fit-api` (the API side is already deployed).
- Charts are rendered with **Highcharts v12** through **highcharts-angular v5**
  registered once in `src/app/app.config.ts`, the file actually passed to
  `bootstrapApplication`. Do not register `provideHighcharts()` anywhere else;
  a provider in a file the bootstrap never reads fails at runtime with `NG0201`
  and a cascading `NG0200` on the first `<highcharts-chart>` while every spec
  that registers it in its own `TestBed` still passes.
- Chart options are produced by **pure functions** in
  `shared/utils/stats-insights-chart.mapper.ts`. The page and the templates never
  build raw Highcharts options inline, and mappers never mutate their input.
- The 120-day cap is a **single exported constant**
  (`STATS_INSIGHTS_MAX_RANGE_DAYS`) consumed by the widget, the state and the
  tests — never a literal `120` in a template or a component.
- `DateService` remains the only owner of `LocalDate` calendar math; the
  feature adds methods to it rather than calling `date-fns` from components.
  Display-only formatting lives in the theme module; API-boundary conversion
  lives in `date.utils.ts` (see Known issues for that boundary's current fuzz).
- **`routineKcal` stays null.** If the backend ever starts estimating routine
  calories, this spec changes; the frontend does not fill the gap.
- This feature does **not** replace `app-input [type]="'date'"]` in the profile,
  strength-metrics, weight or coach form templates (Correction 5).

## Architecture

The page follows the same **thin orchestrator + API/State** shape as `/stats`
(`coding-standards.md` §7.1), with no domain or storage layer because the
feature is read-only:

```
StatsInsightsState (core/services/stats/stats-insights.state.ts)
│   — applied range signal + six per-section signals
│     (data, loading, error); one BehaviorSubject per section driving
│     switchMap, each starting on null so route entry queries nothing
│     (FR-023). run(section, range) next()s ONE subject; a second press
│     cancels the previous request (FR-008's cancellation, new trigger)
└── StatsInsightsService (core/services/stats/stats-insights.service.ts)
      — 6 getters, all network-only (core/apollo/stats-insights.queries.ts)
      ├── handleGraphqlError + AuthService
      └── DateService.getUserTimezone()          — the `input.timezone` value

shared/interfaces/local-date.interface.ts          — canonical LocalDate (new)
shared/interfaces/api/stats-charts-api.interface.ts  — StatsChartsInput + 6 *API shapes
shared/interfaces/stats-insights.interface.ts          — *VM, LocalDateRange, presets, caps, section keys
shared/wrappers/stats-insights.wrapper.ts              — API → VM (lowercase, nulls, rounding, ISO week)
shared/utils/date.utils.ts                           — apiDateTimeToLocalDate (pure)
shared/utils/stats-chart.theme.ts                    — shared palette/formatters + new week/kcal formatters
shared/utils/stats-insights-chart.mapper.ts            — VM → Highcharts.Options (pure, testable)
core/services/date.service.ts                        — isValidLocalDate, daysBetween, lastNDays, isoWeekStartLocalDate
shared/components/ui/input-date/                    — app-input-date (generic calendar control, FR-005/FR-025)
shared/components/widgets/stats/stats-date-range/    — app-stats-date-range (range widget, FR-006)
shared/components/widgets/stats/stats-insights-controls/ — app-stats-insights-controls (chained flow, FR-022)
shared/components/widgets/stats/stats-insights-card/   — app-stats-insights-card (one card per section, FR-024)
```

`StatsInsightsService` lives in the **existing** `core/services/stats/` folder
beside `StatsService`/`StatsState` rather than in a new
`core/services/stats-insights/` folder: the stats domain already has one folder in
`architecture.md` §3, and one feature folder per **route group** is the house
convention (`exercises/`, `plans/`, `day-logs/`). The two services stay separate
classes so the `/stats` spec's "four getters" contract is untouched.

UI tree:

```
/stats/insights → StatsInsightsPage (app-stats-insights-page) — thin orchestrator
 ├── app-stats-insights-controls (app-stats-insights-controls) — the chain, FR-022
 │    ├── app-select           — "¿Qué querés graficar?" (1 of 6)
 │    ├── app-stats-date-range — "desde / hasta" + presets + inline validation
 │    └── app-btn + app-spinner — "Ver gráficas"
 └── app-stats-insights-card ×1 (app-stats-insights-card) — one for the selected
      section, FR-024. Wraps app-stats-section and derives
      loading/refreshing (AC-005) so the page does not.
      ├── app-stats-chart (app-stats-chart) — <highcharts-chart>, shared theme
      └── [cardExtras] — the routineKcal note and the two <ul> detail rows
```

- `app-stats-section` gains only the `refreshing` input (FR-009); its
  `computedAt` input stays unused by this page because on-demand queries have no
  snapshot timestamp — the card header shows the selected range instead, which
  the page passes as a new optional `subtitle` input. **Correction:** the
  `/stats` spec's FR-009 ("Actualizado: …") does **not** apply here; the new
  page shows the range, not a freshness timestamp, because the data is live.
- `app-stats-chart` is reused unchanged; a mapper owns each chart's `height`
  and `marginBottom`, never the component.
- The two `<ul>` detail lists are rendered by the page template and projected
  into the card's `[cardExtras]` slot, as `/stats` already does for "Récords
  personales" (`coding-standards.md` §4: label/value rows → `<ul>/<li>`). They
  are not extracted into widgets; only the shell around them moved (FR-024).

### Card inventory

All six remain; exactly one is reachable per `run` (FR-023). The `label` column
is the **same string** the `app-select` option shows (FR-022) — the dropdown and
the card header read from one constant, so they cannot drift.

| #   | Section key        | Query                       | Card title (ES)           | Chart(s)                                   | Axes / labels           |
| --- | ------------------ | --------------------------- | ------------------------- | ------------------------------------------ | ----------------------- |
| 1   | `oneRm`            | `getStats1RmWeekly`         | 1RM semanal por ejercicio | `line`, ≤6 series, legend on               | x `W##` rot 0, y kg     |
| 2   | `volume`           | `getStatsVolumeWeekly`      | Volumen semanal           | 2 × stacked `column` (ejercicio + músculo) | x `W##` rot 0, y kg     |
| 3   | `volumeTotal`      | `getStatsVolumeTotalWeekly` | Volumen total semanal     | `column`, deload in `accent`               | x `W##` rot 0, y kg     |
| 4   | `calories`         | `getStatsCaloriesWeekly`    | Calorías semanales        | `column` of `extraKcal`                    | x `W##` rot 0, y kcal   |
| 5   | `forgottenMuscles` | `getStatsForgottenMuscles`  | Músculos olvidados        | horizontal `bar` + `<ul>`                  | y músculo, x sets       |
| 6   | `exerciseTrend`    | `getStatsExerciseTrend`     | Tendencia por ejercicio   | diverging `bar` + `<ul>`                   | y ejercicio, x % change |

## Data contract

### API (`shared/interfaces/api/stats-charts-api.interface.ts`)

```ts
import type { LocalDate } from '../local-date.interface';

/** Shared by all six queries; sent as `variables: { input }`. */
export interface StatsChartsInput {
    from: LocalDate; // "yyyy-MM-dd"
    to: LocalDate; // "yyyy-MM-dd"
    timezone?: string; // default "America/Argentina/Buenos_Aires"
}

// 1. getStats1RmWeekly(input: StatsChartsInput!): OneRmExerciseAPI[]
export interface OneRmWeekAPI {
    weekKey: string; // "2026-W40"
    best1RM: number | null; // null when the week has no eligible set
    weightUsed: number | null;
    reps: number | null;
    participated: boolean; // false → the chart shows a gap
}
export interface OneRmExerciseAPI {
    exerciseId: string;
    name: string;
    category: string; // ExerciseCategory, UPPERCASE (BR-004)
    weeks: OneRmWeekAPI[];
}

// 2. getStatsVolumeWeekly(input: StatsChartsInput!): VolumeWeekAPI[]
export interface VolumeWeekExerciseAPI {
    exerciseId: string;
    name: string;
    category: string; // UPPERCASE (BR-004)
    volume: number; // reps × weights
}
export interface VolumeWeekMuscleAPI {
    muscle: string; // ExerciseCategory value, e.g. "chest"
    sets: number;
    volume: number;
}
export interface VolumeWeekAPI {
    weekKey: string;
    exercises: VolumeWeekExerciseAPI[];
    muscles: VolumeWeekMuscleAPI[];
}

// 3. getStatsVolumeTotalWeekly(input: StatsChartsInput!): VolumeTotalWeekAPI[]
export interface VolumeTotalWeekAPI {
    weekKey: string;
    totalVolume: number;
    deltaPct: number | null; // vs the previous week in the series
    possibleDeload: boolean; // true when deltaPct <= -30
}

// 4. getStatsCaloriesWeekly(input: StatsChartsInput!): CaloriesWeekAPI[]
export interface CaloriesWeekAPI {
    weekKey: string;
    routineKcal: number | null; // ALWAYS null — the frontend never fills it
    extraKcal: number;
    totalKcal: number; // === extraKcal
    estimatedSessions: number; // MET-estimated; manual sessions excluded
}

// 5. getStatsForgottenMuscles(input: StatsChartsInput!): ForgottenMuscleAPI[]
export interface ForgottenMuscleAPI {
    muscle: string; // raw enum value, e.g. "chest" (may include backend-only "rest")
    totalSets: number;
    weeksWithoutWork: number;
    lastTrainedAt: string | null; // DateTime ISO
}

// 6. getStatsExerciseTrend(input: StatsChartsInput!): ExerciseTrendAPI[]
export type TrendLabelAPI = 'UP' | 'FLAT' | 'DOWN' | 'INSUFFICIENT';
export interface ExerciseTrendAPI {
    exerciseId: string;
    name: string;
    category: string; // UPPERCASE (BR-004)
    slope: number | null; // linear regression over weekly 1RM
    pctChange: number | null;
    label: TrendLabelAPI;
    weeksUsed: number;
}
```

### View-Model (`shared/interfaces/stats-insights.interface.ts`)

```ts
export interface LocalDateRange {
    from: LocalDate;
    to: LocalDate;
}

export interface StatsDateRangePreset {
    label: string; // product language, e.g. "Últimos 30 días"
    days: number;
}

export const STATS_INSIGHTS_MAX_RANGE_DAYS = 120; // mirrors the backend limit
export const STATS_INSIGHTS_DEFAULT_RANGE_DAYS = 30;
export const STATS_INSIGHTS_RANGE_PRESETS: readonly StatsDateRangePreset[] = [
    { label: 'Últimos 7 días', days: 7 },
    { label: 'Últimos 30 días', days: 30 },
    { label: 'Últimos 90 días', days: 90 },
    { label: 'Últimos 120 días', days: 120 },
];

export type StatsInsightsSection =
    | 'oneRm'
    | 'volume'
    | 'volumeTotal'
    | 'calories'
    | 'forgottenMuscles'
    | 'exerciseTrend';

/** Mapper caps — data-shaping policy, not user preference. */
export const STATS_INSIGHTS_MAX_1RM_SERIES = 6;
export const STATS_INSIGHTS_MAX_VOLUME_SERIES = 8;
export const STATS_INSIGHTS_OTHERS_SERIES_NAME = 'Otros';

// 1RM — mirrors the API; nulls are preserved, never coerced to 0.
export interface OneRmWeekVM {
    weekKey: string;
    best1RM: number | null;
    weightUsed: number | null;
    reps: number | null;
    participated: boolean;
}
export interface OneRmExerciseVM {
    exerciseId: string;
    name: string;
    category: StatsCategory;
    weeks: OneRmWeekVM[];
}

// Volume
export interface VolumeWeekExerciseVM {
    exerciseId: string;
    name: string;
    category: StatsCategory;
    volume: number;
}
export interface VolumeWeekMuscleVM {
    muscle: string;
    label: string; // translated, resolved in the wrapper
    sets: number;
    volume: number;
}
export interface VolumeWeekVM {
    weekKey: string;
    exercises: VolumeWeekExerciseVM[];
    muscles: VolumeWeekMuscleVM[];
}

// Volume total
export interface VolumeTotalWeekVM {
    weekKey: string;
    totalVolume: number;
    deltaPct: number | null;
    possibleDeload: boolean;
}

// Calories
export interface CaloriesWeekVM {
    weekKey: string;
    routineKcal: number | null; // always null; see FR-015
    extraKcal: number;
    totalKcal: number;
    estimatedSessions: number;
}

// Forgotten muscles — `muscle` stays a raw string (Correction 6).
export interface ForgottenMuscleVM {
    muscle: string;
    label: string;
    totalSets: number;
    weeksWithoutWork: number;
    lastTrainedAt: LocalDate | null; // DateTime → LocalDate in the user's timezone
}

// Exercise trend
export type TrendLabelVM = 'UP' | 'FLAT' | 'DOWN' | 'INSUFFICIENT';
export interface ExerciseTrendVM {
    exerciseId: string;
    name: string;
    category: StatsCategory;
    slope: number | null;
    pctChange: number | null;
    label: TrendLabelVM;
    weeksUsed: number;
}
```

`StatsCategory` (`ExerciseCategory | 'unknown'`) is reused from
`shared/interfaces/stats.interface.ts`; unknown API categories map to
`'unknown'` rather than being dropped, matching the `/stats` page.

### UI view-model (frontend-only)

- `app-stats-date-range` emits `LocalDateRange`; nothing else crosses the
  boundary. The page hands it the current `from`/`to` and receives the next one.
- Mappers return `Highcharts.Options | null` (`null` → the section's empty
  state) for empty input, so an empty payload and a no-options payload are the
  same signal (this is how `/stats` already derives `empty`):
    ```ts
    buildOneRmWeeklyChartOptions(exercises: OneRmExerciseVM[]): Options | null;
    buildVolumeByExerciseChartOptions(weeks: VolumeWeekVM[]): Options | null;
    buildVolumeByMuscleChartOptions(weeks: VolumeWeekVM[]): Options | null;
    buildVolumeTotalChartOptions(weeks: VolumeTotalWeekVM[]): Options | null;
    buildCaloriesChartOptions(weeks: CaloriesWeekVM[]): Options | null;
    buildForgottenMusclesChartOptions(muscles: ForgottenMuscleVM[]): Options | null;
    buildExerciseTrendChartOptions(trends: ExerciseTrendVM[]): Options | null;
    ```
- Exported pure helpers, tested directly so the data-shaping policy is checkable
  without reading chart options:
    ```ts
    selectTop1RmExercises(exercises: OneRmExerciseVM[], limit: number): OneRmExerciseVM[];
    selectTopVolumeExercises(weeks: VolumeWeekVM[], limit: number): VolumeSeriesSelection;
    //   { keptIds: string[]; otherIds: string[] }
    weekCategories(weekKeys: string[]): string[];
    ```
- `app-stats-date-range` internal messages (product language): "Elegí una fecha
  de inicio", "Elegí una fecha de fin", "La fecha de inicio no puede ser
  posterior a la de fin", "El rango no puede superar los {maxDays} días".
- `app-input-date` trigger shows the bound value as `dd/MM/yyyy` (its own
  `DISPLAY_FORMAT = 'dd/MM/yyyy'` with `date-fns` `format`), or the `placeholder`
  when the control is empty.

    > **Correction 8 (`dd/MM/yyyy` is not `toDisplayString`).** The Spec originally
    > attributed this to `DateService.toDisplayString()`, which formats
    > `dd-MM-yyyy` with dashes. Changing it would silently alter every existing
    > caller, so `app-input-date` formats locally and a separate pure helper,
    > `formatLocalDateDisplay()` in `stats-chart.theme.ts` (`dd/MM/yyyy`, returns
    > the input unchanged when it is not a real calendar date), serves the page's
    > range label. Both are recorded in
    > `documents/engineering/date-handling.md` §6.

### New formatters and sizes (`shared/utils/stats-chart.theme.ts`)

```ts
export const WEEKLY_CHART_HEIGHT = 240; // x = W## labels, rotation 0
export const MULTI_SERIES_CHART_HEIGHT = 280; // 1RM line chart, legend on
export const DIVERGING_BAR_CHART_HEIGHT = 300; // symmetric % axis
export const TREND_LABEL_COLORS: Record<TrendLabelVM, string>;
// UP → '#50C878' (primary) · FLAT → '#adadad' (text2)
// DOWN → '#D66F6F' (warning) · INSUFFICIENT → '#4472B4' (secondary)
export const DELOAD_POINT_COLOR = '#F5C623'; // accent, already in STATS_CHART_COLORS

export function formatWeekKey(weekKey: string): string; // "2026-W40" → "W40", defensive
export function formatKcal(value: number): string; // es-ES, 0 decimals
export function formatSignedPercent(value: number | null): string; // '+12%' / '-8%' / '—'
```

Reused unchanged: `withStatsTheme`, `STATS_CHART_COLORS`, `formatWeight`,
`formatPercent`, `formatLocalDateShort`, `formatDateTime`, `X_AXIS_LABEL_ROTATION`,
`LONG_LABEL_CHART_HEIGHT`.

### New date helpers

`core/services/date.service.ts` (injectable, calendar math):

```ts
isValidLocalDate(value: string | null | undefined): boolean; // real calendar date, not just the shape
daysBetween(from: LocalDate, to: LocalDate): number; // differenceInCalendarDays, signed
lastNDays(days: number, timezone?: string): LocalDateRange; // [today-(days-1), today]
isoWeekStartLocalDate(weekKey: string): LocalDate | null; // "2026-W40" → Monday
```

`shared/utils/date.utils.ts` (pure, API boundary):

```ts
export function apiDateTimeToLocalDate(iso: string, timezone?: string): LocalDate;
// formatInTimeZone(new Date(iso), tz ?? DEFAULT_TIMEZONE, 'yyyy-MM-dd')
```

## Files

```
# Spec
sdd/stats-insights/spec.md                                       (this file)
sdd/README.md                                                  (+ index row)
sdd/stats/spec.md                                              (+ cross-reference in Context,
                                                                 FR-001 + Architecture correction — Correction 7)

# Documentation (updated after validation — FR-021)
documents/engineering/date-handling.md                          (NEW)
documents/engineering/README.md                                 (+ index row)
documents/engineering/architecture.md                           (§3 folder tree, §5 service table)
documents/design/ui-conventions.md                              (§1 background table: background1, background5)
documents/design/ui-components.md                               (§3 form controls: app-input-date)
documents/plans/stats-charts-range/plan.md                      (NEW — Plan for THIS feature.
                                                                 The previous /stats work left a
                                                                 report at documents/reports/stats-charts.md)

# Routing + page
src/app/app.routes.ts                                           (MOD — stats → loadChildren + authGuard)
src/app/pages/stats/stats.routes.ts                            (NEW — STATS_ROUTES)
src/app/pages/stats/stats.html                                 (MOD — entry app-btn)
src/app/pages/stats/stats-insights/stats-insights.ts               (NEW)
src/app/pages/stats/stats-insights/stats-insights.html             (NEW)
src/app/pages/stats/stats-insights/stats-insights.spec.ts          (NEW)

# Core
src/app/core/apollo/stats-insights.queries.ts                    (NEW — 6 query constants)
src/app/core/services/stats/stats-insights.service.ts            (NEW)
src/app/core/services/stats/stats-insights.service.spec.ts       (NEW)
src/app/core/services/stats/stats-insights.state.ts              (NEW — run(section, range), no load())
src/app/core/services/stats/stats-insights.state.spec.ts         (NEW)
src/app/core/services/date.service.ts                          (MOD — 4 new methods)
src/app/core/services/date.service.spec.ts                     (MOD — new cases)

# Shared contracts + pure logic
src/app/shared/interfaces/local-date.interface.ts               (NEW — canonical LocalDate)
src/app/shared/interfaces/api/stats-charts-api.interface.ts    (NEW)
src/app/shared/interfaces/stats-insights.interface.ts            (NEW)
src/app/shared/wrappers/stats-insights.wrapper.ts                (NEW)
src/app/shared/wrappers/stats-insights.wrapper.spec.ts           (NEW)
src/app/shared/utils/date.utils.ts                             (MOD — apiDateTimeToLocalDate)
src/app/shared/utils/stats-chart.theme.ts                      (MOD — sizes, colors, formatters)
src/app/shared/utils/stats-chart.theme.spec.ts                 (MOD)
src/app/shared/utils/stats-insights-chart.mapper.ts              (NEW)
src/app/shared/utils/stats-insights-chart.mapper.spec.ts         (NEW)

# Shared UI
src/app/shared/components/ui/input-date/input-date.ts           (MOD — stub → FR-005)
src/app/shared/components/ui/input-date/input-date.html         (MOD)
src/app/shared/components/ui/input-date/input-date.spec.ts      (MOD)
src/app/shared/components/widgets/stats/stats-date-range/stats-date-range.ts        (MOD — stub → FR-006)
src/app/shared/components/widgets/stats/stats-date-range/stats-date-range.html      (MOD)
src/app/shared/components/widgets/stats/stats-date-range/stats-date-range.spec.ts   (MOD)
src/app/shared/components/ui/stats/stats-section/stats-section.ts    (MOD — refreshing, subtitle)
src/app/shared/components/ui/stats/stats-section/stats-section.html  (MOD)
src/app/shared/components/ui/stats/stats-section/stats-section.spec.ts (MOD)

# Chained flow (FR-022..FR-025)
src/app/shared/components/widgets/stats/stats-insights-controls/stats-insights-controls.ts        (NEW)
src/app/shared/components/widgets/stats/stats-insights-controls/stats-insights-controls.html      (NEW)
src/app/shared/components/widgets/stats/stats-insights-controls/stats-insights-controls.spec.ts   (NEW)
src/app/shared/components/widgets/stats/stats-insights-card/stats-insights-card.ts               (NEW)
src/app/shared/components/widgets/stats/stats-insights-card/stats-insights-card.html             (NEW)
src/app/shared/components/widgets/stats/stats-insights-card/stats-insights-card.spec.ts          (NEW)
src/app/shared/components/ui/input-date/input-date.html                                       (MOD — hover, FR-025)
src/app/shared/interfaces/stats-insights.interface.ts                                            (MOD — StatsInsightsMetricOption)
tailwind.config.js                                                                             (MOD — safelist: hover:bg-accent/70)
documents/design/ui-conventions.md                                                             (§1 — Correction 10 exception)
documents/plans/stats-charts-interactions/plan.md                                             (NEW — Plan for THIS change)
```

Unchanged on purpose: `stats.service.ts`, `stats.state.ts`, `stats.queries.ts`,
`stats.wrapper.ts`, `stats-chart.mapper.ts`, `app-stats-chart`,
`src/app/app.config.ts`, `src/styles.css`, `src/sw.js`, and the four
`app-input [type]="'date'"]` call sites.

## Implementation Notes

- `StatsInsightsService` mirrors `StatsService`: `apollo.query` with
  `variables: { input }`, `fetchPolicy: 'network-only'`, `handleGraphqlError`,
  then `map(res => wrapper…)`. Six one-liner getters, no `forkJoin`, no optional
  legs — unlike `/stats`'s `getTopRoutines`, nothing here joins a second query.
- `StatsInsightsState` holds the **applied** range as a signal (not `from`/`to`/
  `timezone` separately — the range is the unit it is asked about) plus a
  `Record<StatsInsightsSection, StatsInsightsSectionEntry>` of
  `{ data, loading, error }`. Each section has its own
  `BehaviorSubject<StatsInsightsQueryInput>` consumed through `switchMap`, so
  `run(section, range)` is a single `next()` on **one** subject and cancellation
  is structural (FR-023). The subjects are built in the constructor seeded with
  `null`, which `switchMap` maps to `EMPTY` — that is what makes "route entry
  fires zero requests" a property of the design rather than a check someone has
  to remember. `retry(section)` re-`next()`s that section only, with the applied
  range (FR-011).
- **The applied range is not the pending range.** The card subtitle and
  `retry` read the applied range, so the header can never label a chart with a
  range the user has typed but not yet run. The pending range lives in
  `app-stats-insights-controls` until `run` fires (FR-022).
- `loading`/`refreshing` are **derived**, not stored:
  `loading = loading() && !hasData`, `refreshing = loading() && hasData`. After
  FR-024 they are derived inside `app-stats-insights-card`, once, instead of per
  card in the page. `empty` stays an input because it depends on the mapped
  `Options`, which only the page has.
- Wrapper conversions: `category.toLowerCase()` with an `'unknown'` fallback;
  `muscle`/`label` via the `exerciseCategory` pipe's translation table;
  `lastTrainedAt` ISO → `LocalDate` through `apiDateTimeToLocalDate` with the
  user's timezone; every nullable numeric (`best1RM`, `weightUsed`, `reps`,
  `deltaPct`, `slope`, `pctChange`, `routineKcal`, `lastTrainedAt`) kept as
  `null`, never `0` — coercing them would erase the chart gaps the backend
  encodes. Non-null metrics are rounded (kg 1 decimal, percentages integer) with
  `Intl.NumberFormat('es-ES')`, matching `/stats`.
- Mappers are pure and never mutate their input: they build fresh
  `categories`/`series` arrays, cap series, aggregate `Otros` and return `null`
  for empty input. Long-label charts reuse `LONG_LABEL_CHART_HEIGHT` +
  `ROTATED_LABEL_MARGIN_BOTTOM`; week-key charts use `WEEKLY_CHART_HEIGHT` with
  `marginBottom: 0`.
- `app-input-date` builds its month grid with `date-fns`
  (`startOfMonth`, `startOfISOWeek`-style Monday-first padding, `addMonths`) on
  display-only `Date` objects, then converts each cell back to a `LocalDate`
  string before comparing or emitting — the calendar never leaks a `Date` into
  the feature's domain (BR-003).
- Numeric labels format with `Intl.NumberFormat('es-ES')`; all user-facing
  strings are Spanish (product language); all identifiers, comments and Spec
  text are English.

### Known issues / risks

- **`ExerciseCategory` is out of sync with the backend.** The frontend enum
  (`shared/interfaces/exercise.interface.ts`) has 10 members; the backend has 11
  including `REST`. `getStatsForgottenMuscles` walks the whole catalog, so
  `rest` is the most likely value to arrive untranslated. Mitigation here:
  `ForgottenMuscleVM.muscle` is a raw `string` with a translated `label`, and
  `ExerciseCategoryPipe` already falls back to a capitalized form ("Rest"). The
  real fix — adding `REST = 'rest'` to the frontend enum — touches the exercises
  feature (its form dropdown and `sdd/exercises/spec.md`) and is **out of scope
  here**; it is a separate cross-feature change.
- **`LocalDate` is declared in five modules** (`date.service.ts`,
  `date.utils.ts`, `tracking.interface.ts`, `api/tracking-api.interface.ts`,
  `api/stats-api.interface.ts`). This spec adds the canonical
  `shared/interfaces/local-date.interface.ts` and converts `date.service.ts` into
  a re-export, so the ~10 existing `LocalDate` importers from `date.service`
  keep compiling untouched while new code imports the canonical file. The other
  three declarations remain and are **not** touched (they belong to tracking).
  Because the alias is `string`, this is a hygiene fix, not a breaking change.
- **The Workbox GraphQL cache grows per range (NFR-002).** Six queries × one
  IndexedDB record per distinct `{operationName, variables}`, with no
  `maxEntries` and no expiration. A user who explores twenty ranges leaves 120
  permanent records. `src/sw.js`'s `GRAPHQL_WHITELIST` is dead code that would
  have allowed filtering. Fixing this means changing the SW's cache policy in
  `src/sw.js` and updating `sdd/pwa-offline/spec.md` — a separate change, not
  smuggled in here.
- **The 120-day boundary is ambiguous in the backend description** ("rango <= 120
  días" could mean `to - from <= 120` or an inclusive 120 calendar days). This
  spec implements the conservative reading — `daysBetween(to, from) >
maxDays` is invalid, so the maximum accepted span is `daysBetween === 120` —
  which can only under-accept relative to an inclusive backend rule, never
  over-accept. If the backend confirms the inclusive rule, `maxDays` handling
  moves from the comparison to `>=` in one place and nothing else changes.
- **`routineKcal` is always null.** FR-015 makes that visible instead of
  hiding it, but the calories chart is deliberately half-empty until the backend
  estimates routine calories. Do not "fix" this in the frontend.
- **Display formatters live in a Highcharts theme module.**
  `stats-chart.theme.ts` exports `formatLocalDateShort`, `formatDateTime`,
  `formatWeight`, `formatPercent` — general-purpose formatters that do not
  belong to a chart theme. Adding `formatWeekKey`/`formatKcal` there grows the
  problem. They are not moved in this spec (it would touch the `/stats` page and
  its spec); the correct home is a `shared/utils/format.utils.ts`, and
  `date-handling.md` records it as a known boundary.
- **The two date modules have an implicit, undocumented division.**
  `DateService` (injectable) owns calendar/business math; `date.utils.ts` (pure)
  owns API-boundary conversion. This is real and used here, but only this Spec
  states it — `date-handling.md` makes it canonical.
- **`DateService.localDateToDisplay` has a self-contradicting docstring** (line
  58 says `parseISO` yields local noon, line 62 says local midnight). Pre-existing,
  untouched by this feature, but it is the function `app-input-date` relies on
  for display, so it is worth a one-line fix in a change that touches it.
- **No automated gate for NFR-004 (chart containment).** `TestBed` does not
  load global styles and the e2e suite cannot authenticate
  (`e2e/auth.setup.ts` uses placeholder credentials), so the containment of 7
  new charts is verified by visual inspection only — the same limitation the
  `/stats` spec records.
- **The feature was renamed `stats-charts` → `stats-insights`** (Correction 11).
  Three kinds of `stats-charts` survive on purpose, and a reader who greps the
  repo will hit all of them:
    1. **The backend contract stays named `stats-charts`.** `StatsChartsInput`,
       the `stats-charts` GraphQL namespace, `stats-charts.resolver.ts` and the six
       query names are the deployed `wave-fit-api` contract. So is our mirror of it,
       `shared/interfaces/api/stats-charts-api.interface.ts` — the filename is
       allowed to disagree with the feature so the file is self-identifying as
       "not ours to rename". Everything above the API boundary is `stats-insights`.
    2. **The branch stays `feat/stats-charts`.** It already carries several commits
       of this and unrelated stats work and is not pushed; renaming it would rewrite
       history for no benefit and desynchronize the branch column in
       `documents/reports/README.md`. `git-workflow.md` §1 already notes `feat/` is
       not the canonical prefix — the branch is left as-is, as it was when this
       feature was specced.
    3. **Plans and reports keep their file names.**
       `documents/plans/stats-charts-range/`, `documents/plans/stats-charts-interactions/`
       and `documents/reports/stats-charts*.md` are historical artifacts: they record
       what was delivered under the old name. Per `charter.md` §2 they are
       non-authoritative, so renaming them would rewrite validated history and buy
       nothing. Their **pointers** to live artifacts were updated to
       `sdd/stats-insights/spec.md`; their prose was left as written.
- **Report folder naming.** `documents/reports/stats-charts.md` is the **previous**
  `/stats` dashboard work (Highcharts DI, containment, routine names). It shares
  the old feature name and nothing else. This feature's report, when it ships,
  goes to `documents/reports/stats-charts-range.md`. Its Plan goes in
  `documents/plans/stats-charts-range/plan.md` — the two are deliberately kept in
  separate folders so a plan and a report for different features never share a
  directory. Those three file names are frozen for the reasons above.
- **Branch.** `feat/stats-charts` already carries four commits of unrelated stats
  work and is not pushed. This feature belongs on its own branch
  (`feature/stats-charts-range`) cut from it, so each change stays a separate
  reviewable PR. `feat/` is not the canonical prefix
  (`git-workflow.md` §1); the branch is left as-is, the new one uses `feature/`.
  The rename in Correction 11 does **not** extend to the branch name.

## Tests

Test-first per `documents/engineering/testing.md`: co-located `*.spec.ts`, Karma +
Jasmine, `npm run test:ci`. The `✅ (file)` annotation is added at validation time
(once the suite is green), matching how `sdd/stats/spec.md` marks delivered tests.

- **TEST-001** `app-input-date` renders the bound `LocalDate` as `dd/MM/yyyy`
  and the placeholder when empty; toggles the popover on click; emits
  `dateChange` with a `yyyy-MM-dd` string on selection; closes on `Escape`, on
  outside click and after a selection; `aria-expanded` reflects the state. ✅
  (`input-date.spec.ts`)
- **TEST-002** `app-input-date` disables days outside `min`/`max`, keeps
  `today` and the selected day distinguishable, and never writes to `control` on
  its own. ✅ (`input-date.spec.ts`)
- **TEST-003** `app-stats-date-range` renders exactly two `app-input-date` plus
  one button per preset; a preset sets `from`/`to` through `DateService` and
  emits `rangeChange`; an out-of-order `from` pushes `to` forward instead of
  invalidating. ✅ (`stats-date-range.spec.ts`)
- **TEST-004** `app-stats-date-range` emits **nothing** and reports a message via
  `rangeInvalid` when `from`/`to` is missing, not a valid calendar date, or when
  `daysBetween(to, from) > maxDays` (FR-007). An out-of-order `from` is **not**
  part of this list: it is corrected, per FR-006. ✅
  (`stats-date-range.spec.ts`)
- **TEST-005** `DateService`: `isValidLocalDate` rejects `'2026-02-30'` and
  `'2026-13-01'`; `daysBetween` is signed and inclusive-free; `lastNDays(30)`
  returns a 29-day span ending today in the resolved timezone;
  `isoWeekStartLocalDate('2026-W40')` is the Monday and a malformed key yields
  `null`. ✅ (`date.service.spec.ts`)
- **TEST-006** `apiDateTimeToLocalDate` converts the same ISO instant to
  different `LocalDate`s in UTC-3 and UTC+9 (timezone pinned via the established
  `Intl.DateTimeFormat.prototype.resolvedOptions` spy). ✅
  (`date.utils.spec.ts`)
- **TEST-007** `formatWeekKey('2026-W40') === 'W40'`, malformed keys pass
  through; `formatKcal` and `formatSignedPercent` produce `es-ES` output with
  sign, and `'—'` for `null`; `TREND_LABEL_COLORS` maps all four labels to
  documented tokens. ✅ (`stats-chart.theme.spec.ts`)
- **TEST-008** Each of the six `StatsInsightsService` getters sends
  `variables: { input: { from, to, timezone } }` with `fetchPolicy:
'network-only'`, returns the wrapper VM, and lets `handleGraphqlError`
  errors through (including `UNAUTHORIZED`). ✅
  (`stats-insights.service.spec.ts`)
- **TEST-009** Wrapper: `category` lowercased with an `'unknown'` fallback;
  `lastTrainedAt` ISO → `LocalDate`; every nullable numeric stays `null`
  (`best1RM`, `deltaPct`, `slope`, `pctChange`, `routineKcal`, and a `null`
  `lastTrainedAt`); `label` narrowed to `TrendLabelVM`; metrics rounded.
  ✅ (`stats-insights.wrapper.spec.ts`)
- **TEST-010** Wrapper (Correction 6): a muscle outside the frontend
  `ExerciseCategory` (`'rest'`) is kept verbatim in `muscle` and translated in
  `label` instead of collapsing to `'unknown'`. ✅
  (`stats-insights.wrapper.spec.ts`)
- **TEST-011** Mapper 1RM (FR-012): `chart.type === 'line'`, at most
  `STATS_INSIGHTS_MAX_1RM_SERIES` series selected by participating weeks with a
  deterministic tie-break, `null` weeks kept as `null` (gaps), `legend.enabled:
true`, `xAxis.labels.rotation === 0`. ✅
  (`stats-insights-chart.mapper.spec.ts`)
- **TEST-012** Mapper volume (FR-013): `selectTopVolumeExercises` keeps
  `STATS_INSIGHTS_MAX_VOLUME_SERIES` ids by total volume and returns the rest in
  `otherIds`; the built chart is stacked with an `"Otros"` series and each
  week's stacked total equals the input total (no volume silently dropped); the
  muscle chart has one stacked series per muscle. ✅
  (`stats-insights-chart.mapper.spec.ts`)
- **TEST-013** Mapper volume total (FR-014): `column` chart, default point color
  `primary`, `possibleDeload: true` weeks get `accent`, `deltaPct: null` renders
  "—" and never `0`. ✅ (`stats-insights-chart.mapper.spec.ts`)
- **TEST-014** Mapper calories (FR-015): `column` of `extraKcal`; `routineKcal`
  appears in **no** series, **no** point and **no** tooltip branch even when
  non-null input is fed. ✅ (`stats-insights-chart.mapper.spec.ts`)
- **TEST-015** Mapper forgotten muscles (FR-016): horizontal `bar` with
  `marginBottom: 0`, single series of `totalSets`, backend order preserved (the
  mapper does not re-rank). ✅ (`stats-insights-chart.mapper.spec.ts`)
- **TEST-016** Mapper trend (FR-017): diverging `bar`, symmetric `min`/`max`,
  per-label colors, `INSUFFICIENT` entries excluded from the series, `null`
  `pctChange` excluded. ✅ (`stats-insights-chart.mapper.spec.ts`)
- **TEST-017** All seven builders return `null` on empty input, and no mapper
  mutates the array it receives. ✅ (`stats-insights-chart.mapper.spec.ts`)
- **TEST-018** State (amended by FR-023): the initial range is the last 30 days
  ending today with the resolved timezone; **constructing the state fires zero
  getters**; `run(section, range)` fetches **only** that section and passes the
  range and timezone on every query; a failing section sets only its own
  `error`/`loading`; `retry(section)` re-runs one section with the applied
  range. ✅ (`stats-insights.state.spec.ts`)
- **TEST-019** State (FR-008 as amended by FR-023): running a second time while
  a section is in flight cancels the previous subscription, so a late response
  for the superseded range never reaches `data` (out-of-order protection). The
  trigger is now `run` instead of a range change; the guarantee is identical.
  ✅ (`stats-insights.state.spec.ts`)
- **TEST-020** `app-stats-section`: `refreshing` renders `app-loading` in the
  header **and** keeps `<ng-content>` projected; `loading` still renders the
  skeleton; precedence is `loading` → `error` → `empty` → content; `subtitle`
  renders when provided. ✅ (`stats-section.spec.ts`)
- **TEST-021** Page (amended by FR-022/FR-023/FR-024): renders
  `app-stats-insights-controls`; **issues no request on entry**; with no metric
  selected renders **no** card; picking a metric and pressing "Ver gráficas"
  queries exactly one section and renders exactly one card; shows the
  "Routine calories are not calculated" note; raises one global
  `app-notification` on a section error; retries a single section. ✅
  (`stats-insights.spec.ts`)
    > Extended during validation of the first delivery: a refetch must keep the
    > **previous** chart visible with the header spinner and **no** skeleton
    > (AC-005), which the first delivery did not satisfy — the page handed the
    > shell the raw `loading` signal, whose precedence put the skeleton over the
    > projected chart. After FR-024 that derivation lives in
    > `app-stats-insights-card`, and TEST-024 pins it there.
    > Extended during validation of the chained flow: the card **title** is read
    > from the same `StatsInsightsMetricOption` the select shows, and the card
    > **subtitle** from the section's _applied_ range, so the dropdown and the
    > header cannot drift (FR-022, AC-011). Both are asserted in TEST-021, along
    > with the stale-card case (AC-013).
- **TEST-022** Routing: `/stats` still resolves to `StatsPage`, `/stats/insights`
  resolves to `StatsInsightsPage` under `authGuard`, and both are lazy. ✅
  (`app.routes.spec.ts`)
- **TEST-023** `app-stats-insights-controls` (FR-022): renders exactly one
  `app-select` with six options, the `app-stats-date-range` and one
  `app-btn`; the button is disabled with no metric selected; a
  `rangeChange` from the inner widget **emits nothing**; pressing the button
  emits `run` with the selected section and the pending range; `isRunning`
  disables the button and renders the `app-spinner`. ✅
  (`stats-insights-controls.spec.ts`)
- **TEST-024** `app-stats-insights-card` (FR-024): derives `loading` as
  `loading && !hasData` and `refreshing` as `loading && hasData`, so a refetch
  with data on screen renders `app-loading` in the header **and keeps
  `<ng-content>`**, with no `[aria-busy]` skeleton; precedence is
  `loading` → `error` → `empty` → content; `charts` renders one
  `app-stats-chart` per non-`null` options signal; `[cardExtras]` is projected
  **only** in the content branch. ✅ (`stats-insights-card.spec.ts`)
- **TEST-025** `app-input-date` hover (FR-025): an enabled, non-selected day cell
  carries `bg-accent/70` on hover; the **selected** day does not change on hover;
  a `disabled` day carries `disabled:hover:bg-transparent` and no hover fill.
  ✅ (`input-date.spec.ts`)

## Acceptance Criteria

- **AC-001** `/stats/insights` is reachable from the `/stats` hero button, is
  protected by `authGuard`, and "Volver a Mis Estadísticas" returns to the
  dashboard; the header keeps `/stats` highlighted on both routes.
- **AC-002 (amended by FR-022/FR-023)** The page opens with **no chart and no
  request**. The controls open on the last 30 days ending today and show, in
  order: the metric select, the two date inputs plus the four presets, and the
  "Ver gráficas" button. Picking a preset or a valid custom range updates the
  pending range but **issues no request**; only pressing "Ver gráficas"
  reloads.
- **AC-003** An invalid range (missing, malformed, or more than 120 days) shows an
  inline message, issues **no** request, and leaves the previous charts
  untouched. An out-of-order range is corrected instead (FR-006), so it never
  reaches this state.
- **AC-004** The six cards render the six documented chart types with the shared
  palette: a multi-series 1RM line with gaps, two stacked volume columns, a
  total-volume column with deload weeks highlighted, a calories column,
  a horizontal forgotten-muscles bar, and a symmetric diverging trend bar.
- **AC-005** A section's **first** load shows a card-shaped skeleton; pressing
  "Ver gráficas" again for the same metric with a different range shows an inline
  spinner **while the previous chart stays visible**, with no skeleton flash.
  `app-stats-insights-card` therefore passes `loading = loading && !hasData` to the
  shell, not the raw `loading` signal (FR-024).
- **AC-013** Exactly **one** card is on screen at a time: no metric selected →
  none; a metric selected and "Ver gráficas" pressed → that section's card, with
  the other five never queried (FR-023). A metric not chosen does not appear as
  an inert placeholder.
- **AC-014** The chain is visible and ordered: metric select, then dates, then the
  button. The button is disabled until a metric is chosen, shows a spinner while
  the query is in flight, and a date edit alone never triggers a load (FR-022).
- **AC-015** Hovering a day in the calendar popover tints it `accent/70`; the
  selected day keeps its own fill and a disabled day shows no hover, so neither
  state can be misread (FR-025).
- **AC-016** `npm run lint`, `npm run typecheck`, `npm run test:ci` and
  `npm run build` pass and `npx prettier --check` is clean on every touched file
  for this change (Correction 9, FR-021).
- **AC-006** No chart spills past its card: chart SVGs measure the card's content
  width, not Highcharts' 600px default (NFR-004).
- **AC-007** Week labels read `W40` horizontally; long exercise and muscle names
  keep the −45° rotation; the `W##` labels opt out (NFR-005).
- **AC-008** A failing section shows an error card with "Reintentar", raises one
  global error notification, and retrying that section alone succeeds against the
  current range; the other five sections are unaffected.
- **AC-009** A week with no eligible set appears as a **gap**, not a zero;
  `null` values are never rendered as `0`.
- **AC-010** The calories card states that routine calories are not calculated by
  the server and shows only extra-session calories; the trend card labels
  `INSUFFICIENT` entries as "Sin datos suficientes" instead of a `0%` bar.
- **AC-011** Rapid presses of "Ver gráficas" never display data from a superseded
  range, and a card's subtitle and `retry` always describe the **applied** range,
  not the one being typed (FR-023).
- **AC-012** `npm run lint`, `npm run typecheck`, `npm run test:ci` and
  `npm run build` pass, `npx prettier --check` is clean on every touched file,
  and `documents/engineering/date-handling.md`, `ui-conventions.md` §1 and
  `ui-components.md` §3 are updated with the date rules, the missing
  background tokens and `app-input-date` (FR-021).
