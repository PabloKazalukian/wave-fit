# Plan: Highcharts provider bootstrap (`/stats` NG0201 / NG0200)

## Context

Navigating to `/stats` produces two runtime errors that render the page but
leave the charts blank:

```
ERROR ɵNotFound: NG0201: No provider found for `InjectionToken HIGHCHARTS_LOADER`.
      Source: Standalone[_StatsPage]. Path: _HighchartsChartService -> InjectionToken HIGHCHARTS_LOADER.
ERROR RuntimeError: NG0200: Circular dependency detected for `_HighchartsChartService`.
      Source: Standalone[_StatsPage].
```

## Diagnosis

### Root cause: `app.config.ts` is dead code

`src/main.ts` calls `bootstrapApplication` with an inline `ApplicationConfig` and
never imports `appConfig` from `src/app/app.config.ts`. Nothing else in `src/`
imports `app.config.ts` either, so its `providers` array — including
`provideHighcharts()` — was never registered on the environment injector.

`highcharts-angular@5`'s `HighchartsChartService` is `providedIn: 'root'` and
injects `HIGHCHARTS_LOADER` **without** `optional: true`, so the very first
`<highcharts-chart>` instantiation on the page throws `NullInjectorError`
(NG0201).

### NG0200 is a cascade, not a cycle

There is no ES-module cycle and no DI cycle. In `R3Injector.hydrate`
(`@angular/core`), the record is flipped to the `CIRCULAR` sentinel _before_ the
factory runs, and nothing resets it if the factory throws. The failed
construction therefore leaves `HighchartsChartService` permanently marked
`CIRCULAR` in the root injector, and the next request hits the
`record.value === CIRCULAR` branch and raises `cyclicDependencyError` (NG0200).

Fixing the missing provider removes both errors; no separate work is needed for
NG0200.

### Why unit tests did not catch it

`pages/stats/stats.spec.ts` and
`shared/components/widgets/stats/stats-chart/stats-chart.spec.ts` register
`provideHighcharts()` in their own `TestBed` providers, so the app-level gap was
masked in every spec.

### Spec/document drift

`documents/plans/stats-page/plan.md` (Phase 1, task 2) instructed
"`app.config.ts` += `provideHighcharts()`" — implemented literally, into a file
the bootstrap never reads. `documents/engineering/architecture.md` also lists
`app.config.ts` as the app config file. Code is authoritative: the file exists
and looks right, but is unreachable. Resolved in favour of the file, by making
the bootstrap actually use it.

## Status

> Historical (implementation artifact — not authoritative for current behavior).

## Decisions

- **Single source of truth**: `src/app/app.config.ts` owns the environment
  providers; `src/main.ts` shrinks to `bootstrapApplication(AppComponent,
appConfig)` plus the existing `enableProdMode` / Workbox guards. This is the
  idiomatic Angular 20 layout and removes the dead-file failure mode.
- **Consolidate, not duplicate**: `provideRouter` must appear once, with
  `withInMemoryScrolling({ anchorScrolling: 'enabled' })` from `main.ts`; the
  bare `provideRouter(routes)` currently in `app.config.ts` is replaced.
- **No behavior change to zone/error setup**: the dead `app.config.ts` also
  listed `provideBrowserGlobalErrorListeners()` and
  `provideZoneChangeDetection({ eventCoalescing: true })`, neither of which runs
  today. They are **not** added in this fix — `eventCoalescing` changes change
  detection behaviour and global error listeners change error reporting, so both
  would be unvalidated behavior changes smuggled into a wiring fix.
- **No new spec for `app.config`**: the fix is DI wiring with no isolatable
  behavioral surface, and `HIGHCHARTS_LOADER` is not exported by
  `highcharts-angular`, so it cannot be asserted directly. A smoke spec over
  `appConfig.providers` would drag Apollo + Dexie + the auth initializer into the
  TestBed for no real signal; the existing stats specs already cover the render
  path. Validation is the existing suite, the production build, and a browser
  smoke check.

## Tasks (one at a time)

1. **Plan doc** — this file.
2. **`src/app/app.config.ts`** — move the provider set from `main.ts`:
   `provideHttpClient()`, `provideAuthInitializer()`,
   `{ provide: WORKOUT_STORE, useFactory: workoutStoreByMode }`,
   `provideApollo(() => {...})` (verbatim, including the `ErrorLink` 401 →
   logout + redirect), and `provideRouter(routes, withInMemoryScrolling(...))`.
   Adjust imports for the `src/app/` depth. Keep `provideHighcharts()`.
3. **`src/main.ts`** — drop the inline provider array and the now-unused
   imports; keep `environment`, `enableProdMode`, the Workbox `.then()`.
4. **Cleanup** — drop the commented-out `console.log` debug left in
   `pages/stats/stats.ts` (uncommitted local WIP; the codebase carries no debug
   logs, cf. commit `2abead0`).

## Validation

- `npm run lint`
- `npx prettier --check .`
- `npm test` — full suite stays green; stats specs are unaffected because they
  provide `provideHighcharts()` themselves.
- `npm run build` — proves `main.ts → app.config.ts` resolves under
  `tsconfig.app.json`, and that the `highcharts/esm/highcharts` dynamic import
  stays a lazy chunk under the 1MB initial budget.
- Browser smoke (`npm start`, authenticated `/stats`): four charts render and
  the console is free of NG0201, NG0200 and
  `Highcharts failed to load; chart was not created.`

## Non-goals

- Chart options, theme, mappers, `StatsChart`, and `StatsPage` logic: unchanged.
- Extra Highcharts modules: the four charts use only core `bar` / `column` /
  `line`, so `provideHighcharts({ modules })` stays unset.
- Stable documentation: `architecture.md` already lists `app.config.ts` and
  becomes accurate with this change; no feature behavior is duplicated there.
