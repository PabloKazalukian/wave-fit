# Plan: Correct WS Save Mutations and Extra-Session Target Routing (Active + Deferred)

## Context

The reusable editor components (`WorkoutEdition`, `ExerciseSelector`, `ExtraSessionForm`) already
exist and are shared by the active flow (`my-week` / `my-day` via `TrackingWorkoutComponent`)
and the deferred flow (`WorkoutSessionEditor` → `DayDeferred`). The structural decoupling is in
place: `WorkoutSessionEditor` only emits outputs and `DayDeferred` owns mutation routing.

The behavior is still incomplete:

1. Editing a workout session (WS) does not persist in the day-log cases (active and deferred).
2. Adding an extra-session from a deferred day also creates it on the active day.
3. Removing an extra-session from a day-log uses the wrong GraphQL variable name.

The last commit (`4789fd8`) wired the active week-log save output and split the deferred save
routing per container type, but it did not change the underlying mutation used for day-logs.

## Confirmed Backend Contract

Provided by the product owner:

| Operation                      | Contract                                                                                    | Notes                                                                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `updateDayLog`                 | `mutation UpdateDayLog($input: UpdateDayLogInput!) { updateDayLog(input: $input) { ... } }` | Works for deferred day-logs; no active/exclusivity check. Can update the full `workoutSession`, notes, active, completed, status, exercises, sets. |
| `removeDayLog`                 | `mutation RemoveDayLog($id: String!)`                                                       | Soft delete for deferred day-logs.                                                                                                                 |
| `removeExtraSessionFromDayLog` | `mutation RemoveExtraSessionFromDayLog($workoutSessionId: String!)`                         | Receives a **workout session id**, not an extra-session id.                                                                                        |
| `updateDayLogStatus`           | `mutation UpdateDayLogStatus($date: String!, $isRest: Boolean!)`                            | Day status transition.                                                                                                                             |
| `updateWorkoutSession`         | `UpdateWorkoutSessionInput` including `weekLogId`                                           | Week-log day WS mutation (spec `sdd/tracking/spec.md` FR-008).                                                                                     |

Open item: the exact field that forces the target when creating an extra-session through
`UpdateDayLogInput.extraSession` (or whether `workoutSession: { id }` must be sent in the same
call). To be confirmed with the backend team / schema introspection. The design below does not
depend on that answer to eliminate the active-day write.

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
- **F5** `REMOVE_EXTRA_SESSION_FROM_DAY_LOG` declares `$extraSessionId` and
  `extraSessionId: $extraSessionId` (`day-log.queries.ts:166-173`), but the backend expects
  `$workoutSessionId`. `ExtraSessionCard.delete` emits `session.id` (`extra-session-card.ts:27,89`),
  and `DayDeferred.onExtraSessionDelete` forwards it unchanged (`day-deferred.ts:291-317`).
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
- **D6 — Force the target in the API layer.** All deferred ES mutations receive the explicit
  `dayLogId` / `weekLogId` / `workoutSessionId`; nothing is inferred from `ActiveTracking`.
  Fix `REMOVE_EXTRA_SESSION_FROM_DAY_LOG` to `$workoutSessionId` and resolve the owning
  `workoutSessionId` from the loaded `ExtraSession` before mutating.
- **D7 — Route params are read from both sources.** Accept `weekId`/`weekLogId` and `id` from
  `paramMap` with `queryParamMap` fallback.
- **D8 — Surface success/error.** Save operations return/emit status so the UI can show feedback.
- **D9 — Spec alignment first.** Resolve contradictions in `sdd/add-deferred-day`,
  `sdd/training-history`, `sdd/day-log` and `sdd/tracking` before changing code.

## Target Mutation Map

| Case        | WS save                                                | ES create                                                                                                                         | ES delete                                                             |
| ----------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Active WL   | `UpdateWorkoutSession(workout, activeWeekLogId)`       | `updateTrackingDay` via `ExtraSessionService.create` (active)                                                                     | existing active path                                                  |
| Active DL   | `UpdateDayLog({ id: activeDayLogId, workoutSession })` | `UpdateDayLog` via `ExtraSessionService.create` (active)                                                                          | `RemoveExtraSessionFromDayLog($workoutSessionId)`                     |
| Deferred WL | `UpdateWorkoutSession(workout, routeWeekLogId)`        | `updateTrackingDay({ id: routeWeekLogId, day })`                                                                                  | `removeExtraSession` with explicit context                            |
| Deferred DL | `UpdateDayLog({ id: routeDayLogId, workoutSession })`  | `UpdateDayLog({ id: routeDayLogId, extraSession, workoutSession: { id: routeWsId } })` (final field pending backend confirmation) | `RemoveExtraSessionFromDayLog($workoutSessionId)` with resolved WS id |

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
WL WS save → `updateWorkoutSession`; ES deferred target is explicit; ES delete uses
`workoutSessionId`. Add acceptance criteria for "no active-day writes in deferred mode".

### T2 — Tests first (red)

- Apollo spy specs: mutation name + variables for active DL, deferred DL, active WL, deferred WL.
- `plan-day.api.spec.ts`: `updateDayLog` payload contains `workoutSession.id`, exercises, status.
- `day-log.queries` / `plan-day.api`: delete mutation uses `workoutSessionId`.
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
from the route. Confirm the backend field for forcing the WS target and include it in the
`UpdateDayLogInput` when available.

### T7 — ES delete contract

Change `REMOVE_EXTRA_SESSION_FROM_DAY_LOG` to `$workoutSessionId`; resolve the WS id from the
loaded `ExtraSession` in `DayDeferred` and in the active DL path; update interfaces and wrappers.

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
- **AC-5** Deleting an extra-session uses `workoutSessionId` and succeeds on both active and
  deferred day-logs.
- **AC-6** `/user/week-log-day/:weekId/:dayOrder` and `/user/deferred-day-log/:id` detect the
  correct editor context.
- **AC-7** Save failures are visible in the UI.
- **AC-8** API-level tests assert mutation names and variables for every case above.
- **AC-9** All quality gates pass.

## Status

Draft — written on user request; ready to execute following the Spec → Clarification → Plan →
Tasks → Tests → Implementation → Validation → Documentation workflow.
