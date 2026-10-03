# Plan: Routine names from the live plans catalog

## Context

`/stats` → **Rutinas destacadas** renders a name per routine that the user does
not recognise: the chart shows a literal `Desconocido` (or a stale historical
label) instead of the plan they actually trained.

## Diagnosis

### Root cause is in the backend worker payload, not the frontend

`StatsService.getTopRoutines()` consumed `TopRoutinesStatsAPI` as returned. Each
`TopRoutineAPI` carries a denormalized `name` that the worker copied into the
snapshot when it saved the section. That copy is unreliable: the worker's
`getRawDataForWorker(userId)` payload **excludes global routine plans**, so at
save time the plan referenced by `planId` is not resolvable from the data the
worker has, and the snapshot persists an unresolved placeholder that no later
read can repair.

The `planId` itself is correct and stable. Only the denormalized `name` is
untrustworthy, which makes this repairable from the frontend without touching
the snapshot.

### The live catalog is already reachable

`RoutinesService.getRoutinesPlans()` queries `routinePlans { id name … }` — the
authoritative plan names — and is already the source the rest of the app uses to
label plans. `TopRoutineAPI.planId` joins directly against `RoutinePlanAPI.id`.

## Status

> Historical (implementation artifact — not authoritative for current behavior).
> This plan is written **after** the code, to close the missing-plan gap in the
> uncommitted working tree. The Decisions below describe what the delivered code
> does; they were not all decisions taken deliberately at the time.

## Decisions

- **The join happens in a pure wrapper function, not in the service.**
  `resolveRoutineNames(routines, plans)` lives in `shared/wrappers/stats.wrapper.ts`
  next to the other API→VM transforms, takes only
  `Pick<RoutinePlanAPI, 'id' | 'name'>[]` (so it is unit-testable with plain
  literals and does not drag the full plan shape), and returns a **new** array —
  the input VMs are never mutated, because `StatsState` holds them in signals
  and an in-place write would make the change invisible to the template.
- **Live name wins over the snapshot name, unconditionally.** Not a merge
  heuristic: if the `planId` resolves, the live name is correct by definition and
  a stale-but-plausible snapshot name must not be preferred. Plans with an
  empty `name` are skipped when building the lookup map rather than overwriting
  a good snapshot name with an empty string.
- **The catalog query is optional; the section must not fail on it.**
  `getRoutinesPlans()` is wrapped in `catchError(() => of(undefined))`, so a
  failing catalog degrades the section to the snapshot names. The section's own
  error contract (`FR-004`, `FR-010`) is unchanged: only the stats query can
  put the card into the error state.
- **`forkJoin`, not sequential subscription.** The two queries are independent
  and read-only, so they run in parallel. Consequence accepted: this section
  now waits for the slower of the two, where before it waited for one.
- **Known side effect — the `catchError` also swallows auth errors.**
  `getRoutinesPlans()` pipes through `handleGraphqlError`, which rethrows
  `new Error('UNAUTHORIZED')` on a 401. The outer `catchError` converts that
  into `of(undefined)`, so a plans-query 401 degrades silently instead of
  reaching the app-level `ErrorLink` logout path. In practice the stats query
  401s at the same moment and fails the section as it should, so the user is
  not stranded — but the two paths are not independently correct. Left as-is
  because distinguishing them means re-plumbing the shared error type.
- **Known side effect — cache policy is not `network-only`.**
  `getRoutinesPlans()` declares no `fetchPolicy`, so it uses Apollo's
  `cache-first` default, while the four stats queries are `network-only` per
  `NFR-001`. A renamed plan can therefore show its old name until the
  `routinePlans` cache entry is evicted. Accepted: `routinePlans` is small and
  already cached app-wide by the plans pages, and forcing `network-only` would
  mean a second, differently-shaped query in `core/apollo/stats.queries.ts`.
  The Spec records this divergence explicitly instead of hiding it.

## Non-goals

- **Not a fix for the backend gap.** `getRawDataForWorker` should include global
  plans (or `saveTopRoutines` should resolve the name server-side) so the
  snapshot is correct at rest. This plan is a display-level workaround, and the
  Spec says so in `FR-011`.
- No new `getTopRoutines`-shaped query in `core/apollo/stats.queries.ts`; the
  catalog query is reused from `RoutinesService` as-is.
- No change to the chart, the tooltip, or the x-axis categories beyond the names
  they now receive.
- No offline/IndexedDB persistence of the resolved names (stats is read-only,
  `BR-012` not applicable).

## Tasks (test-first, one at a time)

1. **Plan doc** — this file.
2. **Spec** — `sdd/stats/spec.md`: add `FR-011` (the join, the fallback, the
   rationale, and the explicit "not a substitute for fixing the backend"), widen
   `NFR-001` to name the fifth query and its cache policy, and add `RoutinesService`
   to the Architecture tree.
3. **Wrapper** — `stats.wrapper.ts`: add `resolveRoutineNames`; `stats.wrapper.spec.ts`:
   live name wins, unresolved `planId` keeps the snapshot name, empty/absent
   catalog degrades, stale snapshot name is replaced, empty plan name is ignored,
   input is not mutated, empty input returns `[]`.
4. **Service** — `stats.service.ts`: `forkJoin` the stats query with
   `RoutinesService.getRoutinesPlans()` behind `catchError`;
   `stats.service.spec.ts`: inject a `RoutinesService` spy and cover the live
   name, the empty catalog, a rejected catalog (degrades, does not error) and a
   failing stats query (still surfaces).

## Validation

- `npm run lint`
- `npx prettier --check .`
- `npm test` — full suite green.
- `npm run build`.
- Visual check on `/stats`: the Rutinas destacadas x-axis shows the plan names
  the user recognises; with the catalog query failing the section still renders
  with the snapshot names instead of erroring.
