# Plan: Workout Session Save Wiring

## Context

Editing a `WorkoutSessionVM` does not reach the backend in two flows:

1. **Active week-log day** (`/my-week`, status `EDITED`): `WorkoutEdition` emits
   `saveWorkoutSession`, but `tracking-workout.html` never binds that output to
   `TrackingWorkoutFacade.updateWorkoutSession`. The facade method exists but has
   zero callers, so `WorkoutApi.updateWorkoutSession` is never invoked.
2. **Deferred week-log day** (`/user/history/deferred`): `DayDeferred.onSave`
   routes both container types through `PlanDayService.updateWorkoutSession`
   (day-log API, no `weekLogId`), instead of `WorkoutApi.updateWorkoutSession`
   which is the week-log mutation (plan `deferred-day-editor` D5 and
   `sdd/tracking/spec.md` FR-008). Additionally, the deferred path currently
   writes to the active day-log state via `PlanDayService.updateWorkoutSession`
   `finalize()`, contradicting the deferred-safe rule in FR-013.

## Decisions

- **D1 — Wire the active flow.** Bind `(saveWorkoutSession)` in
  `tracking-workout.html` to `facade.updateWorkoutSession($event)`. The existing
  `WORKOUT_STORE` → `PlanTrackingService` → `WorkoutApi` chain already sends the
  `weekLogId` from active tracking state.
- **D2 — Deferred WL uses the WL mutation directly.** Inject `WorkoutApi` into
  `DayDeferred` and call `updateWorkoutSession(workout, weekLogId)` with the id
  from the route context. Do not use `PlanTrackingService` (its domain reads the
  _active_ tracking, which may be a different week) and do not touch
  `WORKOUT_STORE` (D8 of the deferred plan).
- **D3 — Deferred DL stays on `PlanDayService.updateWorkoutSession`** (FR-013)
  but opts out of the active-state refresh with a new optional `updateActiveState`
  flag (default `true`, so existing callers keep their contract).
- **D4 — Guard empty session id.** If the loaded day has no `workoutSessionId`,
  do not send a mutation with `id: ''`; surface a user-visible error instead.
- **D5 — Spec alignment.** Resolve the FR-013 / tracking-spec contradiction by
  documenting the WL mutation as `WorkoutApi.updateWorkoutSession` with the
  route's `weekLogId`.

## Tasks

### T1 — Tests first (red)

- `tracking-workout.spec.ts`: render `EDITED` status, click `Guardar`, expect
  `facade.updateWorkoutSession` to be called with the edited VM.
- `day-deferred.spec.ts`: expect `WEEK_LOG_DAY` save to call
  `WorkoutApi.updateWorkoutSession(workout, weekLogId)` and **not**
  `PlanDayService.updateWorkoutSession`; expect empty `id` to be rejected.

### T2 — Active WL wiring

- `tracking-workout.html`: add `(saveWorkoutSession)="facade.updateWorkoutSession($event)"`.

### T3 — Deferred routing

- `day-deferred.ts`: inject `WorkoutApi`, split `onSave` per container type,
  add id guard and error feedback.
- `plan-day.service.ts`: optional `updateActiveState` flag.

### T4 — Spec update and validation

- `sdd/training-history/spec.md` FR-013 and `sdd/tracking/spec.md` FR-008.
- Run `npm run test:ci`, `npm run typecheck`, `npm run lint`,
  `npm run format:check`, `npm run build`.
