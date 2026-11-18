# Plan: Correct WS Save Mutations and Extra-Session Target Routing (Active + Deferred)

## Context

The reusable editor components (`WorkoutEdition`, `ExerciseSelector`, `ExtraSessionForm`) already
exist and are shared by the active flow (`my-week` / `my-day` via `TrackingWorkoutComponent`)
and the deferred flow (`WorkoutSessionEditor` → `DayDeferred`). The structural decoupling is in
place: `WorkoutSessionEditor` only emits outputs and `DayDeferred` owns mutation routing.

The behavior is still incomplete:

1. Editing a workout session (WS) does not persist in the day-log cases (active and deferred).
2. Adding an extra-session from a deferred day also creates it on the active day.
3. Extra-session deletion must keep using the backend's `extraSessionId` contract while the
   deferred flow is reworked (an earlier iteration incorrectly switched it to `workoutSessionId`
   and was reverted after a GraphQL validation error).

The last commit (`4789fd8`) wired the active week-log save output and split the deferred save
routing per container type, but it did not change the underlying mutation used for day-logs.

## Confirmed Backend Contract

Provided by the product owner:

| Operation                              | Contract                                                                                    | Notes                                                                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `updateDayLog`                         | `mutation UpdateDayLog($input: UpdateDayLogInput!) { updateDayLog(input: $input) { ... } }` | Works for deferred day-logs; no active/exclusivity check. Can update the full `workoutSession`, notes, active, completed, status, exercises, sets. |
| `removeDayLog`                         | `mutation RemoveDayLog($id: String!)`                                                       | Soft delete for deferred day-logs.                                                                                                                 |
| `removeExtraSessionFromDayLog`         | `mutation RemoveExtraSessionFromDayLog($extraSessionId: String!)`                           | Active day-logs only. Receives the **extra-session id**; `workoutSessionId` is rejected by validation.                                             |
| `removeExtraSessionFromDeferredDayLog` | `mutation RemoveExtraSessionFromDeferredDayLog($extraSessionId: String!)`                   | Deferred (`active: false`) day-logs; returns the day-log without exercises.                                                                        |
| `updateDayLogStatus`                   | `mutation UpdateDayLogStatus($date: String!, $isRest: Boolean!)`                            | Day status transition.                                                                                                                             |
| `updateWorkoutSession`                 | `UpdateWorkoutSessionInput` including `weekLogId`                                           | Week-log day WS mutation (spec `sdd/tracking/spec.md` FR-008).                                                                                     |

Resolved: the target is forced by `UpdateDayLogInput.id` (the day-log id). The current
`CreateExtraSessionWithoutWsInput` has no `workoutSessionId` field, so no extra field is sent;
the explicit `id` is sufficient and keeps deferred writes away from active state. Verified at
runtime — the deferred extra-session create succeeds with `{ id, extraSession }`.

## Findings in Current Code

- **F1** All four WS save paths end in `UPDATE_WORKOUT_SESSION`
  (`src/app/core/apollo/workout.queries.ts:25`):
    - Active WL: `WorkoutEdition` → `TrackingWorkoutFacade.updateWorkoutSession` → `WORKOUT_STORE`
      → `WorkoutStateService` → `PlanTrackingService` → `PlanTrackingDomainService` →
      `WorkoutApi.updateWorkoutSession(workout, weekLogId)` — correct.
    - Active DL: `DayWorkoutStore.updateWorkoutSession` → `PlanDayService.updateWorkoutSession` →
      `PlanDayDomainService` → `PlanDayApi.updateWorkoutSession` — same WL mutation, no
      `weekLogId` (`plan-day.api.ts:151-185`).
    - Deferred DL: `DayDeferred.onSave` → `PlanDayService.updateWorkoutSession(..., { updateActiveState: false })` —
      same as active DL (`day-deferred.ts:212-216`).
    - Deferred WL: `DayDeferred.onSave` → `WorkoutApi.updateWorkoutSession(workout, weekLogId)`
      — correct (`day-deferred.ts:217-236`).
- **F2** `sdd/add-deferred-day/spec.md` BR-020 / AC-104 and `sdd/day-log/spec.md` FR-005 require
  DL to use `updateDayLog`; the code contradicts the spec. Legacy contract notes
  (`documents/legacy/plans/implementation-plan-day.md:206`) warn that `UpdateWorkoutSession`
  requires `weekLogId`, which explains why DL edits are not persisted.
- **F3** No API-level test asserts the mutation name or variables for these paths. There is no
  `workout.api.spec.ts`, and `plan-day.api.updateWorkoutSession` is untested. Existing tests only
  spy on facades/services, so they pass with the wrong mutation.
- **F4** `ExtraSessionForm.onSave()` calls `ExtraSessionService.create()` before emitting
  `saveExtraSession` (`extra-session-form.ts:122-154`). `create()` routes by
  `ActiveTracking.isDayLogActive()` (`extra-session.service.ts:116-125`) and writes to the
  **active** container. Then `DayDeferred.onExtraSessionSave()` writes again to the deferred
  container. Double write → extra-session appears in both days. The form also injects
  `WORKOUT_STORE` and its effect reads/resets from active state (`extra-session-form.ts:66-74`).
- **F5** `REMOVE_EXTRA_SESSION_FROM_DAY_LOG` already declared `$extraSessionId` correctly
  (`day-log.queries.ts`). `ExtraSessionCard.delete` emits `session.id` (`extra-session-card.ts`),
  and `DayDeferred.onExtraSessionDelete` forwards it unchanged. The earlier assumption that the
  backend required `$workoutSessionId` was wrong: runtime validation rejected it with
  `Unknown argument "workoutSessionId"` and required `extraSessionId`. The final implementation
  keeps the original contract and adds API-level coverage for it.
- **F6** Route/context mismatch: route is `/user/week-log-day/:weekId/:dayOrder`
  (`app.routes.ts:83`) but `ngOnInit` reads `weekLogId`; route `/user/deferred-day-log/:id`
  (`app.routes.ts:75`) but the page reads `id` from `queryParamMap`. Those contexts are never
  detected.
- **F7** `PlanTrackingService.updateWorkoutSession` and `PlanDayService.updateWorkoutSession`
  only have `finalize()`; no `next`/`error` feedback reaches the UI when a mutation fails.
- **F8** `PlanDayApi.updateDayLog` builds its result with `patchDayLog(this.state.getDayLogValue(), ...)`
  (`plan-day.api.ts:130-149`). For deferred calls this uses the active day-log as a base; the
  deferred path must avoid that merge.

## Decisions

- **D1 — DL uses `updateDayLog` for WS persistence.** Active DL and deferred DL call
  `PlanDayApi.updateDayLog({ id: <dayLogId>, workoutSession: <mapped WS> })`. The WS id goes in
  `workoutSession.id`; exercises, sets, status and notes are mapped by the existing wrapper.
- **D2 — WL keeps `UpdateWorkoutSession`.** Active and deferred WL use `WorkoutApi.updateWorkoutSession(workout, weekLogId)`
  with the id from the route in the deferred case. No `WORKOUT_STORE` in deferred flows.
- **D3 — Deferred paths stay state-free.** No `setDayLog`, `setDayLogStorage`, `markDayActive`,
  `WORKOUT_STORE` writes or local storage writes. Add a `updateActiveState` / deferred flag where
  needed, defaulting to the current behavior.
- **D4 — `ExtraSessionForm` becomes pure.** Remove `ExtraSessionService.create()` and the
  `WORKOUT_STORE` dependency; validate and emit `saveExtraSession` only.
- **D5 — Active parents own the active ES create.** Bind `(saveExtraSession)` in
  `tracking-day.html`, `tracking-week.html` and `tracking-workout.html` to an explicit call to
  `ExtraSessionService.create` (via their facades). Deferred parent (`DayDeferred`) instead routes
  to the deferred-safe service with the target id from the route.
- **D6 — Force the target in the API layer.** Deferred ES creates receive the explicit
  `dayLogId` / `weekLogId`; nothing is inferred from `ActiveTracking`. ES deletes keep the
  backend contract `REMOVE_EXTRA_SESSION_FROM_DAY_LOG($extraSessionId: String!)` and forward the
  id emitted by `ExtraSessionCard`; the owning container is resolved server-side.
- **D7 — Route params are read from both sources.** Accept `weekId`/`weekLogId` and `id` from
  `paramMap` with `queryParamMap` fallback.
- **D8 — Surface success/error.** Save operations return/emit status so the UI can show feedback.
- **D9 — Spec alignment first.** Resolve contradictions in `sdd/add-deferred-day`,
  `sdd/training-history`, `sdd/day-log` and `sdd/tracking` before changing code.

## Target Mutation Map

| Case        | WS save                                                | ES create                                                                         | ES delete                                               |
| ----------- | ------------------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Active WL   | `UpdateWorkoutSession(workout, activeWeekLogId)`       | `updateTrackingDay` via `ExtraSessionService.create` (active)                     | existing active path                                    |
| Active DL   | `UpdateDayLog({ id: activeDayLogId, workoutSession })` | `UpdateDayLog` via `ExtraSessionService.create` (active)                          | `RemoveExtraSessionFromDayLog($extraSessionId)`         |
| Deferred WL | `UpdateWorkoutSession(workout, routeWeekLogId)`        | `updateTrackingDay({ id: routeWeekLogId, day })`                                  | `removeExtraSession` with explicit context              |
| Deferred DL | `UpdateDayLog({ id: routeDayLogId, workoutSession })`  | `UpdateDayLog({ id: routeDayLogId, extraSession })` (`id` is the explicit target) | `RemoveExtraSessionFromDeferredDayLog($extraSessionId)` |

## Files

- `sdd/add-deferred-day/spec.md`, `sdd/training-history/spec.md`, `sdd/day-log/spec.md`, `sdd/tracking/spec.md`
- `src/app/core/apollo/day-log.queries.ts`
- `src/app/core/services/day-logs/plan-day.service.ts`
- `src/app/core/services/day-logs/plan-day.domain.ts`
- `src/app/core/services/day-logs/plan-day/api/plan-day.api.ts`
- `src/app/core/services/trackings/plan-tracking.service.ts`
- `src/app/core/services/trackings/plan-tracking.domain.ts`
- `src/app/shared/interfaces/api/day-log-api.interface.ts`, `src/app/shared/interfaces/api/tracking-api.interface.ts`
- `src/app/pages/user/history/day-deferred/day-deferred.ts` (+ `.spec.ts`)
- `src/app/shared/components/widgets/tracking/workout-session-editor/workout-session-editor.ts` (+ `.html`, `.spec.ts`)
- `src/app/shared/components/widgets/extra-session/extra-session-form/extra-session-form.ts` (+ `.spec.ts`)
- `src/app/shared/components/widgets/tracking/tracking-day/tracking-day.html`
- `src/app/shared/components/widgets/tracking/tracking-week/tracking-week.html`
- `src/app/shared/components/widgets/tracking/tracking-workout/tracking-workout.html` (+ `.spec.ts`)
- New: `plan-day.api.updateWorkoutSession` / `workout.api` mutation-variable specs

## Tasks (one at a time, tests first)

### T1 — Spec alignment

Rewrite the affected requirements so Spec and Code agree: DL WS save → `updateDayLog`;
WL WS save → `updateWorkoutSession`; ES deferred target is explicit (`dayLogId` /
`weekLogId`); ES delete uses `extraSessionId`. Add acceptance criteria for "no active-day
writes in deferred mode".

### T2 — Tests first (red)

- Apollo spy specs: mutation name + variables for active DL, deferred DL, active WL, deferred WL.
- `plan-day.api.spec.ts`: `updateDayLog` payload contains `workoutSession.id`, exercises, status.
- `day-log.queries` / `plan-day.api`: delete mutation declares and sends `extraSessionId`.
- `extra-session-form.spec.ts`: no call to `ExtraSessionService.create` / no `WORKOUT_STORE` use.
- `day-deferred.spec.ts`: route params `weekId`/`id`; explicit ES target; feedback on error.
- `tracking-workout.spec.ts`: `(saveExtraSession)` wired to the active create path.

### T3 — DL WS save via `updateDayLog`

Add a deferred-safe method (e.g. `updateWorkoutSessionDeferred(dayLogId, workout)`) in
`PlanDayService`/domain/API that calls `UpdateDayLog` and skips the `patchDayLog(activeState, ...)`
merge. Route active DL and deferred DL through it with the appropriate `updateActiveState` flag.
Keep WL on `WorkoutApi`.

### T4 — Save feedback

Expose the save observable or a result signal from the facade/page; show success/error on the
editor. No silent failures.

### T5 — `ExtraSessionForm` pure + active wiring

Remove `service.create()` and `WORKOUT_STORE` from the form; wire `(saveExtraSession)` in the
three active templates to an explicit facade method that calls `ExtraSessionService.create`.

### T6 — Deferred ES create with explicit target

`DayDeferred.onExtraSessionSave` calls deferred service methods with `dayLogId` / `weekLogId`
from the route. The target is forced by `UpdateDayLogInput.id`; `CreateExtraSessionWithoutWsInput`
has no `workoutSessionId` field, so the payload is `{ id, extraSession }`.

### T7 — ES delete contract

Keep `REMOVE_EXTRA_SESSION_FROM_DAY_LOG($extraSessionId: String!)` and forward the id emitted by
`ExtraSessionCard` through `PlanDayApi` → domain → service → `DayDeferred` / `ExtraSessionService`.
An intermediate iteration switched it to `$workoutSessionId` and failed at runtime with
`GRAPHQL_VALIDATION_FAILED`; it was reverted and covered with API/service/page assertions.

### T8 — Route context detection

Read `weekId`/`weekLogId` and `id` from `paramMap` with query-param fallback; add tests for
`/user/week-log-day/:weekId/:dayOrder` and `/user/deferred-day-log/:id`.

### T9 — Validation gates

`npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test:ci`, `npm run build`.

### T10 — Stable documentation update

Only after all gates pass: update `documents/engineering/architecture.md` and the relevant
domain/spec notes. Do not use this plan as current documentation.

## Acceptance Criteria

- **AC-1** Active WL and deferred WL persist WS edits through `UpdateWorkoutSession` with `weekLogId`.
- **AC-2** Active DL and deferred DL persist WS edits through `UpdateDayLog` with `workoutSession`.
- **AC-3** No deferred flow writes active tracking state, active day-log state or local storage.
- **AC-4** Adding an extra-session in a deferred day creates it only in that deferred container;
  the active day remains unchanged.
- **AC-5** Deleting an extra-session uses `extraSessionId`: active day-logs use
  `RemoveExtraSessionFromDayLog`, deferred day-logs use `RemoveExtraSessionFromDeferredDayLog`
  (T11).
- **AC-6** `/user/week-log-day/:weekId/:dayOrder` and `/user/deferred-day-log/:id` detect the
  correct editor context.
- **AC-7** Save failures are visible in the UI.
- **AC-8** API-level tests assert mutation names and variables for every case above.
- **AC-9** All quality gates pass.

## Status

T1–T8 implemented and validated. T7 was corrected after runtime GraphQL validation showed the
backend requires `extraSessionId`, not `workoutSessionId`. Live-backend reproduction showed
`removeExtraSessionFromDayLog` only resolves **active** day-logs, so the backend added
`removeExtraSessionFromDeferredDayLog($extraSessionId: String!)`; T11 wires it into the deferred
path. T9 (quality gates) and T10 (stable documentation) remain. Plans are historical and
non-authoritative — see `sdd/` and `documents/engineering/` for current behavior.

### T11 — Deferred ES delete mutation (backend-provided)

`PlanDayApi.removeExtraSessionFromDeferredDayLog` calls the new backend mutation and maps the
result with `patchDayLog(null, …)` so active day-log state is never read or merged.
`PlanDayDomainService.removeExtraSessionDeferred` routes deferred deletes through it; the active
path keeps `RemoveExtraSessionFromDayLog`.
