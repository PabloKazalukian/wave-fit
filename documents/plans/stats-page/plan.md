# Plan: Stats page (`/stats`)

## Context

`/stats` is a new read-only dashboard that renders the fixed, pre-computed
statistics the backend worker generates on each training checkpoint (completing a
day, a week, a plan-day). The frontend consumes four unparameterized queries
(`getTopExercises`, `getTopRoutines`, `getPersonalRecords`, `getAdherence`) and
visualizes them with Highcharts. The worker-only read/write endpoints
(`getRawDataForWorker`, `save*`) use `ServiceAuthGuard` and are **not** exposed
to the frontend.

Spec: `sdd/stats/spec.md`. Branch: `feature/stats-page` (canonical naming per
`documents/engineering/git-workflow.md`).

## Status

> Historical (implementation artifact — not authoritative for current behavior).
> Phases 1–7 fully implemented and validated (typecheck, lint, 462 unit tests,
> prettier, production build).

- [x] Phase 1 — dependency + cleanup (`provideHighcharts()`, dead placeholder removed)
- [x] Phase 2 — contracts (interfaces, queries)
- [x] Phase 3 — mapping layer (wrapper, theme, mappers + specs)
- [x] Phase 4 — `StatsService` + `StatsState` (+ specs)
- [x] Phase 5 — shared UI (`StatsSection`, `StatsChart` + specs)
- [x] Phase 6 — page + navigation (`/stats`, header user dropdown)
- [x] Phase 7 — spec/docs drift (`architecture.md` updated too)

## Decisions

- **Route**: new lazily-loaded top-level `/stats` guarded by `authGuard`. The
  dead-code placeholder `/user/trackings/stats` (a week-count card fed by local
  `TrackingListState`) is **removed** together with its route — it was not
  linked anywhere. Navigation entry: header **user dropdown** (desktop + mobile),
  next to "Mi Historial".
- **Visualization**: install `highcharts@^12` + `highcharts-angular@^5`
  (Angular 20 compatible per the official compatibility table; v5 requires
  Angular ≥ 19 / Highcharts ≥ 12.2). Register via `provideHighcharts()` in
  `app.config.ts` and use the standalone `HighchartsChartComponent`. All chart
  options come from **pure mappers**; the page never builds raw Highcharts
  options.
- **Data flow**: `StatsService` (4 `network-only` getters, `handleGraphqlError`)
  → `StatsState` (per-section `signal` of data/loading/error/computedAt,
  `load()` parallel + `reload(section)`, error isolation per section) → thin
  page `Stats` maps VMs to `Highcharts.Options` and renders four `StatsSection`
  cards (shell: skeleton/empty/error+retry/content) around `StatsChart` (generic
  Highcharts wrapper with the app theme).
- **Chart types**: Top Exercises → horizontal `bar` (totalVolume); Top Routines
  → vertical `bar` (adherenceRate %); Personal Records → `column` (bestWeight
  kg) + table with "Nuevo PR" badge; Adherence → `line` (adherencePercent per
  week). Empty arrays → empty-state card; failures → error card + retry + one
  global `app-notification`.
- **No offline caching**: reads are `network-only` (freshness) — BR-012
  (offline-first writes) does not apply to a read-only feature.

## Tasks (test-first, one at a time)

### Phase 1 — Dependency + cleanup

1. `npm i highcharts@^12 highcharts-angular@^5` (updates `package.json` /
   `package-lock.json`).
2. `app.config.ts` += `provideHighcharts()`.
3. Delete `pages/trackings/stats/stats.ts`; remove the `stats` child route from
   `pages/trackings/tracking.routes.ts` (drop `Stats` import).

### Phase 2 — Contracts + queries

4. `shared/interfaces/api/stats-api.interface.ts`: the four API containers and
   item shapes (field names exactly as in the backend query contract).
5. `shared/interfaces/stats.interface.ts`: VM shapes (same as API, domain types
   applied) + `isNewRecord()` predicate.
6. `core/apollo/stats.queries.ts`: `GET_TOP_EXERCISES`, `GET_TOP_ROUTINES`,
   `GET_PERSONAL_RECORDS`, `GET_ADHERENCE` (unparameterized, must match
   resolver field selection).

### Phase 3 — Mapping layer (pure, unit-tested)

7. `shared/wrappers/stats.wrapper.ts` + spec: category `toLowerCase()`,
   LocalDate passthrough, `previousOneRm` null handling, number rounding.
8. `shared/utils/stats-chart.theme.ts` + spec: base `Highcharts.Options` from
   the app tokens (palette, text2, transparent background, credits disabled).
9. `shared/utils/stats-chart.mapper.ts` + spec: the four builders returning
   `Highcharts.Options | null` for empty input; number/Intl formatting (`es-ES`);
   `isNewRecord` used by the PR badge and tooltip.

### Phase 4 — Service + State

10. `core/services/stats/stats.service.ts` + spec: four getters
    (`apollo.query`, `network-only`, `handleGraphqlError`, mapped to section VM).
11. `core/services/stats/stats.state.ts` + spec: signals per section,
    `load()` (parallel, error-isolated), `reload(section)`.

### Phase 5 — Shared UI

12. `shared/components/ui/stats/stats-section/` + spec: card shell with
    title, `updatedAt?`, loading skeleton, empty message, error + `retry`
    emission, projected content.
13. `shared/components/widgets/stats/stats-chart/` + spec: wraps
    `HighchartsChartComponent`, applies the theme, `height` input.

### Phase 6 — Page + navigation

14. `pages/stats/stats.ts|html|spec.ts`: orchestrator (state → options +
    PR table), four `StatsSection`s, global `app-notification` on any section
    error, per-section retry.
15. `app.routes.ts` += lazy `/stats` with `authGuard`.
16. `header.ts/.html`: "Estadísticas" entry in the user dropdown (desktop +
    mobile) next to "Mi Historial".

### Phase 7 — Spec/docs drift (same change scope)

17. `sdd/tracking/spec.md`: FR-012 and Files no longer reference
    `/user/trackings/stats` / `stats/` under trackings.
18. `sdd/day-log/spec.md`: Files line drops `stats/` from `pages/trackings`.
19. `sdd/README.md`: index row `Stats | sdd/stats/spec.md | /stats`.
20. `documents/engineering/architecture.md`: new `pages/stats/` and
    `core/services/stats/` folders (only after validation).

## Validation

```bash
npm run typecheck
npm run lint
npm run test:ci             # or: ng test --watch=false --browsers=ChromeHeadless --include=<spec> per new spec
npx prettier --write src/app/core/services/stats src/app/core/apollo/stats.queries.ts \
  src/app/shared/interfaces/stats.interface.ts src/app/shared/interfaces/api/stats-api.interface.ts \
  src/app/shared/wrappers/stats.wrapper.ts src/app/shared/utils/stats-chart.theme.ts \
  src/app/shared/utils/stats-chart.mapper.ts src/app/shared/components/ui/stats \
  src/app/shared/components/widgets/stats src/app/pages/stats src/app/app.routes.ts \
  src/app/app.config.ts src/app/shared/components/layout/header sdd/stats /documents/plans/stats-page
```

No new e2e test: the page is read-only and the Playwright suite is minimal and
manual (see `documents/engineering/testing.md`); backend data is pre-computed.

## Backend coordination

The four queries and their fields must exist in `wave-fit-api` (resolvers in
`stats.resolver.ts`, shapes in `presentation/entities/*.output.ts`). Field
selection is exact: a missing field fails the whole query. Deploy the API side
before/with the frontend.
