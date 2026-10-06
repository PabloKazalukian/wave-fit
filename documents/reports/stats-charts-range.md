# Report: Stats charts — date-range analytics page (`/stats/insights`)

> **Historical / Non-Authoritative.** Record of the work delivered on branch
> `feat/stats-charts` for the `/stats/insights` page. Current behavior: see
> [`sdd/stats-insights/spec.md`](../../sdd/stats-insights/spec.md). Plan rationale
> lives in
> [`../plans/stats-charts-range/plan.md`](../plans/stats-charts-range/plan.md).
>
> Not to be confused with [`stats-charts.md`](stats-charts.md), which records
> unrelated earlier work on the `/stats` **dashboard** and is also on
> `feat/stats-charts`.

## 1. Objective

`/stats` shows four worker-precomputed snapshots over the whole history, with no
date input anywhere in the app. It could not answer _"how did my training change
between these two dates?"_. The backend already exposed a second, read-only
`stats-charts` namespace: six queries that aggregate the raw history on demand for
a user-chosen range. The frontend had nothing.

## 2. What was delivered

| Phase | Scope                                                                                                                     | Tests                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 1     | Canonical `LocalDate` / `LocalDateRange`, `DateService` calendar math, `apiDateTimeToLocalDate`                           | TEST-005, TEST-006           |
| 2     | Six API shapes, six VM families, six GraphQL operations selecting exactly the fields the backend exposes                  | —                            |
| 3     | Six API→VM wrappers, seven VM→`Highcharts.Options` builders, theme tokens and formatters                                  | TEST-007, TEST-009..017      |
| 4     | `StatsInsightsService` (six getters) and `StatsInsightsState` (one `switchMap` per section)                               | TEST-008, TEST-018, TEST-019 |
| 5     | `app-input-date`, `app-stats-date-range`, `refreshing` + `subtitle` on `app-stats-section`                                | TEST-001..004, TEST-020      |
| 6     | `StatsInsightsPage`, `stats.routes.ts`, `loadChildren` in `app.routes.ts`, hero entry button, `StatsInsightsState.data()` | TEST-021, TEST-022           |

**673 → 676 unit tests**, all green.

The page is a thin orchestrator over `StatsInsightsState` (per
`coding-standards.md` §7.1): six `app-stats-section` cards, seven charts, the
range widget, two `<ul>` detail lists (forgotten muscles, exercise trend) and
the routine-calories note. The template uses `@for` over a card descriptor array
rather than six hardcoded blocks.

## 3. Decisions worth remembering

These are already in the Plan; they are the ones that would be expensive to
rediscover.

- **`refreshing` is derived, never stored.** `loading() && data() !== null`,
  computed in the page. A fourth state field would let `loading` and `refreshing`
  disagree. Consequence: `app-stats-section` gained exactly two inputs
  (`refreshing`, `subtitle`) and no new card shell.
- **Cancellation is structural.** Each section is one
  `BehaviorSubject<StatsInsightsQueryInput>` consumed through `switchMap`, so a late
  response for a superseded range physically cannot reach `data` (TEST-019).
- **`nullable` numbers stay `null` to the chart.** `participated: false` means "no
  eligible set this week"; coercing to `0` would render it as "trained and lifted
  nothing".
- **Series caps live in the pure mapper** (top 6 for 1RM, top 8 + `"Otros"` for
  volume-by-exercise so the stacked total is preserved). In a component they would
  be untestable without a chart.
- **Out-of-order ranges are corrected; over-long ranges are rejected.** One rule,
  two behaviors, decided by whether the correction is unambiguous.

## 4. Defects found during validation

Two were caught by unit tests, one by writing this report.

1. **Refetch replaced the previous chart with a skeleton.** The page passed the
   shell the raw `loading` signal, and the shell's precedence
   (`loading` → `error` → `empty` → content) put the skeleton over the projected
   chart — so FR-009 / AC-005 ("previous chart stays visible") never held during
   a range change. The page now derives `loading = loading && data === null`.
   Found by a new TEST-021 case; fixed in `stats-insights.ts:141`.
2. **The `volume` card's empty state needed all charts, not one.** Checking a
   single chart would hide the other exactly when it _does_ have data, so `empty`
   requires every chart in the card to be `null`.
3. **`DateService.toDisplayString()` returns `dd-MM-yyyy`, not `dd/MM/yyyy`.** The
   Spec attributed the date trigger's slash format to it. Changing it would have
   silently altered every existing caller, so `app-input-date` formats locally and
   a new pure `formatLocalDateDisplay()` in `stats-chart.theme.ts` serves the
   page's range label. Recorded as Correction 8 in the Spec and in
   `date-handling.md` §6.

## 5. Open items

- **Visual pass not performed.** AC-006 (containment, NFR-004) and AC-007 (label
  rotation, NFR-005) can only be proven by looking at the rendered page. The e2e
  suite cannot help: `e2e/auth.setup.ts` uses placeholder credentials. **This is
  the one acceptance criterion not yet evidenced.**
- **The 120-day boundary is an assumption, not a confirmation.** The backend
  description reads either as `to - from <= 120` or as 120 inclusive days. The
  implementation takes the conservative reading
  (`daysBetween(to, from) > maxDays` is invalid), which can only under-accept.
  If the backend confirms the inclusive rule the fix is `>` → `>=` in one
  comparison. **Open question for `wave-fit-api`; it blocked nothing.**
- **`stats-chart.theme.ts` is now a boundary.** It holds four display formatters
  (`formatWeekKey`, `formatKcal`, `formatSignedPercent`, `formatLocalDateDisplay`)
  that are not theme concerns and belong in a `format.utils.ts`. Relocation is
  explicitly out of scope for this Spec.
- **Workbox GraphQL cache growth is untouched (NFR-002).** Each explored range
  leaves six permanent IndexedDB records with no `maxEntries` and no expiration.
  Fixing it requires `sdd/pwa-offline/spec.md`; the dead `GRAPHQL_WHITELIST` in
  `src/sw.js` would have allowed filtering. Deliberately not smuggled in here.
- **`ExerciseCategory` enums have drifted.** The backend has 11 categories, the
  frontend 10. `getStatsForgottenMuscles` walks the whole catalog, so `rest` is
  the likely untranslated arrival; it is handled locally by keeping
  `ForgottenMuscleVM.muscle` a raw `string`. Syncing the enum touches the
  exercises feature.
- **`DateService.localDateToDisplay` has a self-contradicting docstring** (line
  55 says local noon, line 59 says local midnight). Pre-existing;
  `app-input-date` depends on that function. A one-line fix belongs in a change
  that touches it.

## 6. Validation performed

| Gate                                   | Result                                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                         | pass                                                                                                                |
| `npm run typecheck`                    | pass                                                                                                                |
| `npm test` (full Karma/Jasmine)        | 676 SUCCESS                                                                                                         |
| `npm run build`                        | pass; Workbox precaches 149 URLs; pre-existing initial-budget warning (854 kB vs 500 kB warn)                       |
| `npx prettier --check <touched files>` | clean                                                                                                               |
| `npx prettier --check .`               | **219 files, pre-existing debt** — includes files this change never touched (`tsconfig.json`, `tailwind.config.js`) |
| Visual pass on `/stats/insights`       | **not performed** — see §5                                                                                          |

## 7. Documentation updated

- `documents/engineering/date-handling.md` (new) + its `README.md` row.
- `documents/design/ui-conventions.md` §1: `bg-background1` (`#151A16`) and
  `bg-background5` (`#367C4D`) rows added.
- `documents/design/ui-components.md` §3: `app-input-date` documented, with the
  explicit note that it does not yet replace `app-input [type]="'date'"]`.
- `documents/engineering/architecture.md` §3 folder tree and §5 service table.
- `sdd/stats/spec.md`: FR-001 + Architecture corrected for the route
  restructuring (Correction 7).
- `sdd/stats-insights/spec.md`: Correction 8 (the `dd/MM/yyyy` contradiction),
  AC-005 and TEST-021 annotated with the refetch defect and its fix.
