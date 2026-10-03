# Stats (Estadísticas)

## Context

The stats page (`/stats`) is a **read-only** dashboard that displays the **fixed,
pre-computed statistics** the backend generates on each training checkpoint
(completing a day, a week, a plan-day) through a worker. The frontend only
consumes four unparameterized queries — it never writes statistics.

The worker-facing getters/writers (`getRawDataForWorker(userId)` and the
`saveTopExercises` / `saveTopRoutines` / `savePersonalRecords` / `saveAdherence`
mutations) are **not** exposed to the frontend: they are protected by
`ServiceAuthGuard` (JWT with role `SERVICE`) and are only used by the
worker/Lambda. Backend resolvers live in `stats.resolver.ts`, response shapes in
`presentation/entities/*.output.ts` (wave-fit-api repository).

Visualization uses **Highcharts** (highcharts + highcharts-angular v5), a new
project dependency approved for this feature.

> **Related feature:** `/stats/insights` is a **separate** page, not an extension
> of this one. It aggregates the raw training history on demand over a
> **user-selected date range** through six other queries, whereas the four
> queries below are **unparameterized** worker snapshots. See
> [stats-insights](../stats-insights/spec.md). The two pages share the Highcharts
> theme, the card shell (`app-stats-section`) and the chart wrapper
> (`app-stats-chart`), but have independent services, state and data contracts.
> (That feature was specced as `stats-charts` at `/stats/charts` and was renamed
> to `stats-insights`; its backend input type is still `StatsChartsInput`.)

## Requirements

### FR: Functionality

- **FR-001** `/stats` is a top-level route protected by `authGuard` (BR-005),
  loaded lazily, reachable from the header **user dropdown** (desktop + mobile)
  next to "Mi Historial".

    > **Correction 7 (route restructuring).** `/stats` is no longer a leaf route.
    > It is registered as `loadChildren` over `pages/stats/stats.routes.ts`, which
    > maps `''` to this dashboard and `'insights'` to `/stats/insights` (owned by
    > `sdd/stats-insights/spec.md`). `authGuard` stays on the parent entry, so both
    > children are protected by one guard. The header needs no change:
    > `isActive()` compares with `startsWith`, so `/stats/insights` keeps `/stats`
    > highlighted. No requirement in this Spec changes behaviourally.

- **FR-002** `StatsService` exposes four getters that run `network-only`
  (NFR-001) and normalize failures through `handleGraphqlError`:
  `getTopExercises`, `getTopRoutines`, `getPersonalRecords`, `getAdherence`.
- **FR-003** Each section loads **independently and in parallel**
  (`StatsState.load()`); a section failing or empty does not block the others.
- **FR-004** Each section renders one of four states: skeleton while loading,
  chart (or table) when data exists, empty-state card when the payload array is
  empty, and error card + retry when the query fails. Any section error also
  raises one global `app-notification` (error).
- **FR-005** `Top Exercises` renders a vertical `column` chart of `totalVolume`
  per exercise (defensive top 10 by ascending rank); the tooltip shows
  `totalSessions` and `avgVolumePerSession`.
- **FR-006** `Top Routines` renders a vertical `column` chart of `adherenceRate`
  (%) per routine (label `dd/MM`); the tooltip shows `totalSessions` and
  `totalWeeks`.
- **FR-007** `Personal Records` renders a `column` chart of `bestWeight` (kg)
  per exercise plus a table with category, best weight/reps, `achievedAt` and a
  "Nuevo PR" badge on records where the estimated 1RM improved over
  `previousOneRm` (`previousOneRm == null` is the first record for the exercise
  and counts as a new PR).
- **FR-008** `Adherencia` renders a `line` chart of `adherencePercent` per
  `weekStartDate` (label `dd/MM`, `yAxis.max: 100`), with the tooltip showing
  completed/skipped/pending days breakdown.
- **FR-009** Each section card exposes "Actualizado: …" derived from its own
  `computedAt` (DateTime), formatted with the user's locale.
- **FR-010** Retry is available per section (`StatsState.reload(section)`); the
  global notification can be dismissed without affecting the cards.
- **FR-011** `Top Routines` resolves each routine's `name` against the live
  `routinePlans` catalog by `planId` (`resolveRoutineNames`), preferring it over
  the name stored in the worker snapshot. If the `planId` does not resolve, the
  snapshot name is kept. A failure of the catalog query degrades to the
  snapshot names instead of failing the section. Rationale: the worker's
  `getRawDataForWorker` payload excludes global plans, so the snapshot can
  persist an unresolved name; this is a display-level workaround for that
  backend gap and is not a substitute for fixing it.

### BR

- `BR-003` applies: all dates in view models are `LocalDate` strings
  (`"yyyy-MM-dd"`), never JS `Date`.
- `BR-004` applies: `category` arrives in UPPERCASE and is normalized with
  `toLowerCase()` in the wrapper.
- `BR-005` applies: the route is protected (`authGuard`).
- `BR-012` (offline-first writes) is **not** applicable: stats is read-only and
  does not write, queue, or persist.

### NFR

- **NFR-001** The four statistics queries bypass the Apollo cache
  (`network-only`) to guarantee freshness; the page never caches statistics
  locally (no state persistence, no IndexedDB/localStorage). The fifth query
  feeding the page — the `routinePlans` catalog used by `FR-011` — is **not** one
  of the four: it is reused from `RoutinesService` and runs `cache-first`, so a
  plan renamed since the last `routinePlans` fetch can render its old name until
  that cache entry is evicted. This divergence is deliberate and bounded; the
  statistics themselves are always fresh.
- **NFR-002** Chart visuals must reuse the app palette tokens
  (`ui-conventions.md` §1) and the dark card backgrounds; Highcharts credits are
  disabled.
- **NFR-003** The statistics payload is bounded and light (ranked lists + a few
  weeks); no pagination is needed.
- **NFR-004** Every chart renders **inside** its `StatsSection` card: the
  `<highcharts-chart>` host must be block-level with `width: 100%`, otherwise
  Highcharts measures a 0-width inline element and falls back to its 600px
  default, overflowing the card. The page container is `max-w-2xl` (wider than
  the app-wide `max-w-lg` of the other pages) so long category labels are not
  crowded. Above ~672px the container sets the chart width; below that the
  viewport does.
- **NFR-005** X-axis category labels are rotated **−45°** (app-wide theme
  convention) so long exercise/routine names fit the card content width; short
  `dd/MM` date labels opt out with `rotation: 0`.

## Constraints

- **Read-only**: no create/edit/delete, no persistence, no sync-queue interplay.
- Charts are rendered with **Highcharts v12** through the official
  **highcharts-angular v5** standalone component (`provideHighcharts()`),
  registered once in `src/app/app.config.ts`. That file must be the config
  actually passed to `bootstrapApplication` (`src/main.ts`): `HIGHCHARTS_LOADER`
  is injected without `optional: true`, so a provider registered in a file the
  bootstrap never reads fails at runtime with `NG0201` (and a cascading
  `NG0200`) on the first `<highcharts-chart>` while every spec that registers
  `provideHighcharts()` in its own `TestBed` still passes.
- The four queries are **unparameterized** and their field selections must match
  the backend schema exactly (a missing field fails the whole query). Deployment
  must be coordinated with `wave-fit-api`.
- Chart options are produced by **pure functions** (`stats-chart.mapper.ts`);
  the page never builds raw Highcharts options inline.
- The former placeholder `/user/trackings/stats` (week-count card computed from
  local `TrackingListState`) is **removed** — it was dead code, not linked
  anywhere.

## Architecture

The page is a **thin orchestrator** (see `documents/engineering/coding-standards.md`
§7.1) over a small signals state (`StatsState`), following the API + State
pattern (no domain/storage layer — the feature is read-only):

```
StatsState (core/services/stats/stats.state.ts)          — per-section signals: data, loading, error, computedAt
└── StatsService (core/services/stats/stats.service.ts)  — 4 section getters (core/apollo/stats.queries.ts)
      ├── handleGraphqlError + AuthService
      └── RoutinesService.getRoutinesPlans()             — only for getTopRoutines (FR-011), optional
shared/wrappers/stats.wrapper.ts                         — API → VM (LocalDate, category, rounding) + resolveRoutineNames
shared/utils/stats-chart.theme.ts                        — Highcharts base theme from app tokens
shared/utils/stats-chart.mapper.ts                       — VM → Highcharts.Options (pure, testable)
```

`getTopRoutines` is the only getter that is not a single query: it `forkJoin`s
its own `network-only` stats query with `RoutinesService.getRoutinesPlans()`,
so that section resolves after the slower of the two. The catalog leg is wrapped
in `catchError(() => of(undefined))` and a rejected catalog degrades the section
to the snapshot names rather than failing it — the section's error state is
reserved for its own stats query (FR-004, FR-010). The four other sections are
unaffected and each still resolves from one request.

UI tree:

```
/stats → StatsRoutes (pages/stats/stats.routes.ts, authGuard on the parent in app.routes.ts)
  ├── '' → Stats (app-stats) — thin orchestrator (state → options via mappers)
  │    └── StatsSection (app-stats-section) — card shell: skeleton / empty / error+retry / content
  │         └── StatsChart (app-stats-chart) — generic <highcharts-chart> wrapper (theme applied)
  └── 'insights' → StatsInsights (app-stats-insights) — range-parameterized page
       (owned by sdd/stats-insights/spec.md; reuses StatsSection and StatsChart,
       adds the `refreshing` and `subtitle` inputs to StatsSection)
```

> **Correction 7.** The tree above is the delivered shape. `StatsSection` gained
> two inputs (`refreshing`, `subtitle`) for the insights page; its four-state
> precedence is unchanged.

- `Stats` owns no query/persistence logic: it reads `StatsState` signals,
  starts `load()` on `ngOnInit`, maps VM → options through the pure mappers, and
  renders four `StatsSection` cards (two with a `StatsChart`, one with chart +
  table, one with chart).
- `StatsSection` receives `title`, `computedAt?`, `loading`, `error`, `empty`
  and `emptyMessage`, and emits `retry`; content is projected through
  `<ng-content>`.
- `StatsChart` receives `options: Highcharts.Options` and always applies the
  shared theme. Chart `height` / `marginBottom` are **not** component inputs:
  each mapper owns its own sizing.
- The new page class is named `Stats`; the placeholder class with the same name
  under `pages/trackings/stats/` is deleted with its route.

**Highcharts/Theme note:** charts are themed via the tokens
(`#50C878` primary, `#4472B4` secondary, `#F5C623` accent, `#C83A6E` confirm,
`#adadad` text2) on transparent card background (`bg-background2` card shell);
no Highcharts dependency on DOM measurements beyond the component's own sizing.

## Data contract

### API (shared/interfaces/api/stats-api.interface.ts)

```ts
// Fields as returned by wave-fit-api (presentation/entities/*.output.ts).
export interface TopExerciseAPI {
    rank: number;
    exerciseId: string;
    name: string;
    category: string; // ExerciseCategory, UPPERCASE (BR-004)
    totalSessions: number;
    totalVolume: number;
    avgVolumePerSession: number;
}
export interface TopRoutineAPI {
    rank: number;
    planId: string;
    name: string;
    totalWeeks: number;
    totalSessions: number;
    adherenceRate: number; // percent
}
export interface PersonalRecordAPI {
    exerciseId: string;
    exerciseName: string;
    category: string; // ExerciseCategory, UPPERCASE (BR-004)
    oneRmEstimated: number;
    bestWeight: number;
    bestReps: number;
    bestVolume: number;
    achievedAt: string; // LocalDate "yyyy-MM-dd" (BR-003)
    previousOneRm: number | null; // null → first record for the exercise
}
export interface AdherenceWeekAPI {
    weekStartDate: string; // LocalDate "yyyy-MM-dd" (BR-003)
    totalDays: number;
    completedDays: number;
    skippedDays: number;
    pendingDays: number;
    adherencePercent: number; // 0..100
}

// Section containers (each query returns one of these):
// TopExercisesStatsAPI   { id: string; userId: string; computedAt: string /* DateTime ISO */; exercises: TopExerciseAPI[] }
// TopRoutinesStatsAPI    { id: string; userId: string; computedAt: string; routines: TopRoutineAPI[] }
// PersonalRecordsStatsAPI{ id: string; userId: string; computedAt: string; records: PersonalRecordAPI[] }
// AdherenceStatsAPI      { id: string; userId: string; computedAt: string; weeks: AdherenceWeekAPI[] }
```

### View-Model (shared/interfaces/stats.interface.ts)

Same shapes as the API but with the canonical domain types applied:

```ts
// category: ExerciseCategory (lowercase, BR-004) | 'unknown'
// achievedAt / weekStartDate: LocalDate; computedAt: DateTime ISO
// VMs: TopExerciseVM, TopRoutineVM, PersonalRecordVM, AdherenceWeekVM
// Section VMs: TopExercisesVM { id, userId, computedAt, exercises: TopExerciseVM[] }, ... (mirrors API)
```

The interface files are line-for-line duplicates of the spec contract. `ExerciseCategory`
comes from `shared/interfaces/exercise.interface.ts`; unknown categories map to
`'unknown'` (never thrown away in charts, still rendered).

### UI view-model (frontend-only)

- `isNewRecord(record): boolean` — `previousOneRm == null` or
  `oneRmEstimated > previousOneRm` (FR-007 badge).
- Chart option builders return `Highcharts.Options | null` (null → empty state)
  for empty inputs:
    - `buildTopExercisesChartOptions(entries: TopExerciseVM[]): Highcharts.Options | null`
    - `buildTopRoutinesChartOptions(entries: TopRoutineVM[]): Highcharts.Options | null`
    - `buildPersonalRecordsChartOptions(entries: PersonalRecordVM[]): Highcharts.Options | null`
    - `buildAdherenceChartOptions(weeks: AdherenceWeekVM[]): Highcharts.Options | null`

## Files

```
src/app/core/apollo/stats.queries.ts                     (+ test? no — queries are constants)
src/app/core/services/stats/stats.service.ts             (+ stats.service.spec.ts)
src/app/core/services/stats/stats.state.ts               (+ stats.state.spec.ts)
src/app/shared/interfaces/api/stats-api.interface.ts
src/app/shared/interfaces/stats.interface.ts             (+ stats.interface.spec.ts optional — keeps shapes honest)
src/app/shared/wrappers/stats.wrapper.ts                 (+ stats.wrapper.spec.ts)
src/app/shared/utils/stats-chart.theme.ts                (+ stats-chart.theme.spec.ts — palette/token assertions)
src/app/shared/utils/stats-chart.mapper.ts               (+ stats-chart.mapper.spec.ts)
src/app/shared/components/ui/stats/stats-section/        (stats-section.ts, .html, .spec.ts)
src/app/shared/components/widgets/stats/stats-chart/     (stats-chart.ts, .html, .spec.ts)
src/app/pages/stats/  (stats.ts, stats.html, stats.spec.ts)
src/app/app.routes.ts                                     (add lazy /stats)
src/app/shared/components/layout/header/                 (header.ts/.html — user dropdown link, desktop + mobile)
src/app/app.config.ts                                     (provideHighcharts() + the app's provider set)
src/main.ts                                               (bootstrapApplication(AppComponent, appConfig) — no inline providers)
src/styles.css                                            (@layer base: highcharts-chart { display: block; width: 100% } — NFR-004)
```

Removed:

```
src/app/pages/trackings/stats/stats.ts                   (placeholder — delete)
src/app/pages/trackings/tracking.routes.ts               (drop the 'stats' child route)
src/app/pages/user/user.ts                               (getStats local aggregation stays — not part of this feature)
```

## Implementation Notes

- `StatsService` follows the `TrainingHistoryService` pattern (query via
  `apollo.query`, `fetchPolicy: 'network-only'`, `handleGraphqlError`, map to
  the response container). Four public getters, each returning its section VM.
- `StatsState` keeps per-section `signal` triples
  (`topExercises`/`topRoutines`/`personalRecords`/`adherence` + `loading` +
  `error` + `computedAt`). `load()` subscribes the four getters in parallel;
  `reload(section)` re-runs a single one. Errors are captured per section
  (never throw from state; the page shows the global notification).
- Wrapper conversions: `category.toLowerCase()`, `achievedAt`/`weekStartDate`
  kept as `LocalDate` strings, numbers rounded (volume/avg/1RM `1` decimal,
  percentages integer), `previousOneRm` → `number | null`, `computedAt` kept as
  ISO.
- Numeric labels in charts format to `'1,2'` decimals with `Intl.NumberFormat`
  (`es-ES`) — user-facing content is Spanish (product language).

### Known issues / risks

- **Highcharts first provider use**: highcharts-angular v5 registers Highcharts
  through `provideHighcharts()`; confirm the exact standalone component API
  (`Highcharts`, `options`, `update`) from the installed package README before
  wiring `StatsChart` (v5 changes input-based update semantics).
- **Backend contract coupling**: any field selected in `stats.queries.ts` that
  the backend does not return fails that query at field-selection level; deploy
  the API side in tandem (resolvers already expose the shapes per user info).
- **`/user/trackings/stats` removal** touches `sdd/tracking/spec.md` (FR-012,
  Files) and `sdd/day-log/spec.md` (Files) — spec drift corrected in the same
  change scope (see Plan).
- **Theme dark background**: charts are transparent over `bg-background2`; any
  future light theme must be handled by the theme util, not per-chart.
- **No automated gate for NFR-004 (containment)**: `TestBed` does not load global
  styles, and the e2e suite cannot reach `/stats` — `e2e/auth.setup.ts` logs in
  with placeholder credentials (`admin@test.com` / `password123`). The chart
  containment is therefore verified by visual inspection only. Closing this
  requires either real e2e credentials or a host-element width assertion in a
  test that loads `styles.css`.
- **Residual x-axis label overlap (NFR-005)**: with top 10 long names in the
  card content width, a ~75px label rotated 45° projects ~53px against a ~44px
  category slot, so some overlap is expected and accepted. Rotation was chosen
  over truncation. If the visual check is not acceptable, the follow-up is
  `labels.style.textOverflow: 'ellipsis'` + `labels.maxLength`, or dropping to
  top 5.
- **Auth errors from the optional catalog leg are swallowed (FR-011)**:
  `getRoutinesPlans()` rethrows `UNAUTHORIZED` through `handleGraphqlError`, and
  the `catchError` around it degrades that to `of(undefined)` instead of letting
  it reach the app-level logout path. The stats query 401s simultaneously and
  fails the section as expected, so no user is stranded, but the two error paths
  are not independently correct. Distinguishing them means re-plumbing the
  shared error type — not done here.
- **`getRawDataForWorker` backend gap**: the worker payload excludes global
  plans, which is the root cause FR-011 works around. The fix belongs in
  `wave-fit-api`; until then the snapshot `name` stays untrustworthy and the
  frontend join is load-bearing.

## Tests

- **TEST-001** `getTopExercises` sends the query with `network-only`, returns
  the section VM (wrapper applied) and lets `handleGraphqlError` errors through.
  ✅ (`stats.service.spec.ts`)
- **TEST-002** Same contract for `getTopRoutines`. ✅ (`stats.service.spec.ts`)
- **TEST-002a** `getTopRoutines` joins the live plan name over the snapshot name
  by `planId`; keeps the snapshot name when the catalog is empty or the
  `planId` does not resolve; degrades to snapshot names (no section error) when
  the catalog query fails; still surfaces the error when the **stats** query
  fails. ✅ (`stats.service.spec.ts`)
- **TEST-002b** `resolveRoutineNames`: live name wins over a stale snapshot
  name, unresolved `planId` keeps the snapshot name, empty/absent catalog
  degrades, a plan with an empty `name` is ignored, the input array is not
  mutated, empty input returns `[]`. ✅ (`stats.wrapper.spec.ts`)
- **TEST-003** Same contract for `getPersonalRecords`. ✅ (`stats.service.spec.ts`)
- **TEST-004** Same contract for `getAdherence`. ✅ (`stats.service.spec.ts`)
- **TEST-005** Wrapper: `category` lowercase, `achievedAt`/`weekStartDate`
  LocalDate preserved, `previousOneRm` null kept, volume/avg/1RM rounded.
  ✅ (`stats.wrapper.spec.ts`)
- **TEST-006** Mappers: given sample VMs produce expected series/categories;
  empty input returns `null` for all four builders. ✅ (`stats-chart.mapper.spec.ts`)
- **TEST-006a** Mappers (NFR-004, NFR-005): the three ranking/metric charts are
  `column` (`chart.type` and `series[0].type`) at `LONG_LABEL_CHART_HEIGHT` with
  `ROTATED_LABEL_MARGIN_BOTTOM` and `xAxis.labels.rotation === -45`; Adherencia
  is `line` at `ADHERENCE_CHART_HEIGHT` with `marginBottom: 0` and
  `xAxis.labels.rotation === 0`. ✅ (`stats-chart.mapper.spec.ts`)
- **TEST-007** Theme: colors/background/credits match the app tokens.
  ✅ (`stats-chart.theme.spec.ts`)
- **TEST-007a** Theme: the base options declare the −45° x-axis rotation, and
  `withStatsTheme`'s deep merge can still override it per chart.
  ✅ (`stats-chart.theme.spec.ts`)
- **TEST-008** State: `load()` populates every section; a failing query sets
  only its own `error`/`loading` and leaves the others untouched;
  `reload(section)` resets and re-fetches one section. ✅ (`stats.state.spec.ts`)
- **TEST-009** `StatsSection` renders skeleton while `loading`, empty message
  when `empty`, error + `retry` emission on error, and projects content.
  ✅ (`stats-section.spec.ts`)
- **TEST-010** `StatsChart` receives mapped options and renders the Highcharts
  host. ✅ (`stats-chart.spec.ts`)
- **TEST-011** Page composition: renders four sections, triggers parallel
  `load()`, shows "Nuevo PR" badge for new records, global `app-notification`
  on section error, per-section retry. ✅ (`stats.spec.ts`)

## Acceptance Criteria

- **AC-001** `/stats` is reachable from the user dropdown and renders the four
  statistics sections from the backend queries.
- **AC-002** Loading shows skeletons; empty payloads show "Aún no hay datos de …".
- **AC-003** A section failure shows an error card with retry plus one global
  error notification; other sections still render.
- **AC-004** Charts follow the app palette and render without Highcharts
  credits.
- **AC-005** Personal records distinguish new PRs (badge) vs previous 1RM.
- **AC-006** Retrying a failed section succeeds without a page reload.
- **AC-007** The old `/user/trackings/stats` placeholder is gone (dead code
  removed) and described specs are aligned.
- **AC-008** No chart spills past its card: the chart SVG measures the card's
  content width, not Highcharts' 600px default (NFR-004).
- **AC-009** The three ranking/metric charts are vertical columns with −45°
  x-axis labels; Adherencia is a line chart with horizontal `dd/MM` labels
  (NFR-005).
- **AC-010** `Top Routines` labels each routine with its current plan name from
  the catalog, and still renders (with the snapshot names) if the catalog query
  fails (FR-011).
