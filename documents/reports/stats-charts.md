# Report: Stats charts — branch `feat/stats-charts`

> **Historical / Non-Authoritative.** Record of the work landed on branch
> `feat/stats-charts`: three stats fixes (Highcharts DI bootstrap, chart
> containment + orientation, routine-name resolution) plus the Spec alignment.
> Current behavior: see [`sdd/stats/spec.md`](../../sdd/stats/spec.md). Per-plan
> rationale lives in
> [`highcharts-provider-bootstrap/plan.md`](../plans/highcharts-provider-bootstrap/plan.md),
> [`stats-vertical-charts/plan.md`](../plans/stats-vertical-charts/plan.md) and
> [`stats-routine-name-resolution/plan.md`](../plans/stats-routine-name-resolution/plan.md).
>
> This report covers the `/stats` **dashboard** work only. It is unrelated to
> `/stats/charts`, the date-range page specced in
> [`sdd/stats-charts/spec.md`](../../sdd/stats-charts/spec.md) and planned in
> [`documents/plans/stats-charts-range/plan.md`](../plans/stats-charts-range/plan.md),
> which reuses the theme, card shell and chart wrapper fixed here.

## 1. Objective

Three separate defects were sitting uncommitted in the `main` working tree with
no branch, no plan for one of them, and a plan that contradicted the delivered
code. This report records what was recovered, corrected and validated so the
branch can be pushed and continued.

## 2. Starting state

- The branch `feat/stats-charts` named in the original request **never existed**
  in this repository (not local, not remote, not in the reflog, no stash). The
  equivalent branch was `feature/stats-page`, already merged into `main` via PR
  #11 on 2026-09-24.
- `main` was clean and in sync with `origin/main`; all stats work was sitting as
  **13 uncommitted modified files** directly in the `main` working tree, plus two
  untracked plan directories.
- 14 of the 14 real content changes belonged to no branch, in violation of the
  `AGENTS.md` workflow (branch -> commit -> PR).

## 3. What was done

The uncommitted working tree was moved onto a new `feat/stats-charts` branch and
split into four atomic commits, so each concern is reviewable and revertable on
its own.

| Commit    | Content                                                                                                                                                                                                                                               | Plan                            |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `58dcd44` | `src/app/app.config.ts` becomes the single provider set (Apollo + 401 `ErrorLink`, `WORKOUT_STORE`, auth initializer, router with `anchorScrolling`, `provideHighcharts()`); `src/main.ts` reduced to `bootstrapApplication(AppComponent, appConfig)` | `highcharts-provider-bootstrap` |
| `6bc0d54` | `highcharts-chart { display: block; width: 100% }` in `src/styles.css`; Top Exercises `bar` -> `column`; fixed chart heights + `marginBottom`; −45° x-axis label rotation in the shared theme; page container `max-w-lg` -> `max-w-2xl`               | `stats-vertical-charts`         |
| `658fe19` | `resolveRoutineNames()` in `stats.wrapper.ts`; `StatsService.getTopRoutines()` `forkJoin`s its own `network-only` query with `RoutinesService.getRoutinesPlans()` behind a degrading `catchError`                                                     | `stats-routine-name-resolution` |
| `74a1630` | `sdd/stats/spec.md` aligned with the delivered behavior (FR-011, NFR-001, NFR-004, NFR-005, Architecture tree, Files, TEST-002a/002b/006a/007a, AC-008/009/010, Known issues)                                                                         | —                               |

Total: 16 files, +853 / −136.

### 3.1 The two root causes worth remembering

- **NG0201 / NG0200 on `/stats`** was not a DI cycle. `src/main.ts` called
  `bootstrapApplication` with an inline `ApplicationConfig` and never imported
  `appConfig` from `src/app/app.config.ts`, so `provideHighcharts()` was dead
  code in a file nothing read. `HIGHCHARTS_LOADER` is injected without
  `optional: true`, so the first `<highcharts-chart>` threw `NullInjectorError`;
  NG0200 was the cascade, because `R3Injector.hydrate` flips the record to
  `CIRCULAR` before the factory runs and nothing resets it when the factory
  throws. Every spec registered `provideHighcharts()` in its own `TestBed`, which
  is why the unit suite was green while the page was blank.
- **The "charts look horizontal and spill out" report** was one defect, not two.
  `highcharts-chart` is an unknown element, so it computed to `display: inline`,
  measured `offsetWidth === 0`, and Highcharts fell back to its hardcoded 600px
  default inside a ~440px card (`highcharts.src.js`: `chartWidth = Math.max(0,
widthOption || containerBox.width || 600)`). The `overflow: hidden` Highcharts
  applies to the host has no effect on a non-replaced inline box, so nothing
  clipped. Only `Top Exercises` was genuinely horizontal.

### 3.2 Plan corrected to match the code

`stats-vertical-charts/plan.md` as first written proposed converting **all four**
sections to `column`, claiming it "supersedes `FR-008`". The delivered code does
not do that and should not: **Adherencia stays a `line` chart**, because a weekly
adherence series is a trend over time and columns would replace a direction with
disconnected bars while making `plotOptions.line.marker` meaningless. The plan's
Context, Decisions, Task 2, Task 5, Validation and Non-goals were all corrected to
state that `FR-005` is the only chart-type change, with the reasoning recorded.

`stats-routine-name-resolution/plan.md` is **new** — the `resolveRoutineNames`
change had been implemented with no plan at all, against the `AGENTS.md`
requirement that a plan is mandatory. It is written retroactively and says so.

## 4. Validation

| Gate                                      | Result                                             |
| ----------------------------------------- | -------------------------------------------------- |
| `npm run lint`                            | All files pass linting                             |
| `npm run typecheck`                       | clean                                              |
| `npx prettier --check <17 touched files>` | All matched files use Prettier code style          |
| `npm run test:ci`                         | **478 / 478 SUCCESS**                              |
| `npm run build`                           | exit 0; service worker written, 143 URLs precached |

Two gate notes:

- **`npm test` is `ng test` in watch mode and never exits.** Use
  `npm run test:ci` (`ng test --watch=false --browsers=ChromeHeadless`). This cost
  a hung session before the right script was found.
- **The build emits a pre-existing budget warning**: initial 854.78 kB against
  `maximumWarning: 500kB` / `maximumError: 1MB` in `angular.json`. It is below the
  error threshold and predates this branch. What the plan actually needed to prove
  holds: `highcharts` is still a **lazy chunk** of 275.49 kB and is not counted in
  the initial total.

## 5. Open items

Carried forward, none of them blocking:

1. **The branch has no upstream and is not pushed.** `git push -u origin
feat/stats-charts` when a connection is available.
2. **No visual validation was performed.** Both plans require a browser check on
   an authenticated `/stats`: chart SVG measuring the card width (not 600px),
   nothing spilling past the rounded corners, three column charts plus the
   Adherencia line chart, rotated labels on the columns and horizontal `dd/MM`
   on Adherencia. Two defects in this branch were found by _looking_ at the page,
   so a visual pass should not be skipped. `npm start` + a real login is required;
   the e2e suite cannot help because `e2e/auth.setup.ts` uses placeholder
   credentials (`admin@test.com` / `password123`).
3. **Residual x-axis label overlap is accepted, not fixed.** With top 10 long
   names in the card content width, a ~75px label rotated 45° projects ~53px
   against a ~44px category slot. If the visual check is not acceptable, the
   follow-up is `labels.style.textOverflow: 'ellipsis'` + `labels.maxLength`, or
   dropping to top 5.
4. **`series.name` asymmetry left in place.** `lineSeries(data)` lost its
   `name: 'Adherencia'` literal (a leftover from the rejected "all columns"
   draft) while the three column calls still pass a name to
   `columnSeries(name, data)`. It is inert — the base theme sets
   `legend.enabled: false` and every section uses a custom `tooltip.formatter`
   that builds its own header from the point name. Tidy it by dropping the
   parameter from `columnSeries`, or restoring it on `lineSeries`, in whichever
   change next touches these helpers.
5. **The backend gap behind FR-011 is still open.** The worker's
   `getRawDataForWorker(userId)` payload excludes global routine plans, so the
   snapshot `name` is untrustworthy and the frontend join is load-bearing. The
   real fix belongs in `wave-fit-api` (`getRawDataForWorker` should include global
   plans, or `saveTopRoutines` should resolve the name server-side). Until then
   the Spec says so explicitly in `FR-011`.
6. **`getRoutinesPlans()` uses `cache-first`, not `network-only`.** A plan renamed
   since the last `routinePlans` fetch can render its old name. Recorded in
   `NFR-001` rather than hidden. Related: the `catchError` around that query also
   swallows the `Error('UNAUTHORIZED')` that `handleGraphqlError` rethrows on a
   401, so a plans-query 401 degrades silently instead of reaching the app-level
   logout path. The stats query 401s simultaneously and fails the section as
   expected, so no user is stranded, but the two error paths are not
   independently correct — fixing that means re-plumbing the shared error type.
7. **`src/app/pages/stats/stats.ts` shows as modified but was deliberately not
   committed.** `git diff` produces no hunk and the index and HEAD blob hashes are
   identical (`7acd582`): it is CRLF stat-cache noise, not a content change.
   Harmless, but it keeps the working tree dirty. `git update-index
--really-refresh` clears it.
8. **Repo-wide Prettier debt is untouched.** `npm run format:check` fails on 138
   files and `prettier --check .` on 225, all pre-existing on `main`. The 17 files
   touched here are individually clean, which is why the plan's Validation step
   was scoped to them instead of the repo-wide form that cannot pass. Worth a
   separate cleanup change.

## 6. Suggested next steps

1. `git push -u origin feat/stats-charts`
2. Visual pass on an authenticated `/stats` (open item 2) — the only validation
   this branch has not had.
3. Open a PR against `main`.
4. File the `wave-fit-api` fix for `getRawDataForWorker` (open item 5).
5. Separately: repo-wide Prettier cleanup (open item 8).
