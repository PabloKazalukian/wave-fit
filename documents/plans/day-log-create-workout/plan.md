# Plan: Day-log `createWorkout` — unified `UpdateDayLog`

## Context

`DayWorkoutStore.createWorkout` (the "Completar el día" flow) resolved through
`PlanDayService.setRestDay(date, false)` → `PlanDayApi.updateDayLogStatus` →
`UpdateDayLogStatus`. That path only ever produces `status: 'pending'` (or
`'skipped'`), so tapping "Completar el día" never moved the day's workout to
`complete` and the UI stayed on the "start" state.

## Decision

`createWorkout` now uses the **unified `UpdateDayLog`** mutation, matching the
week-log `days[].workoutSession` contract:

```
updateDayLog({
  id,
  status: 'complete',
  timezone,                       // used by the backend to create the WS when missing
  workoutSession: { id?, date, status: 'complete', exercises },
})
```

- `workoutSession.status: 'complete'` → the day workout becomes **editable** (`StatusWorkoutSessionEnum.COMPLETE`); the day-log `status: 'complete'` is a display-only value.
- `completed` is **not** sent: the day stays open. Closing the day remains
  `completeDayLog` (`completed: true` → `active = false` → `/my-day/success`).
- The returned `UpdateDayLog` payload is stored as the new day-log state.
- `UpdateDayLogStatus` / `setRestDay` are kept for the rest-day toggle.

### Semantics (backend, final)

- `status` (day-log) is a 100% front-owned **display-only** value (`pending` · `complete` · `skipped`): `updateDayLog` persists it as-is, with no side effects on `completed`, `active` or the WS, and the backend never infers it.
- `completed: true` is the **only** day-closing action: `active = false` (and guarantees a WS). Independent from `status`.
- The real rest path remains `updateDayLogStatus(date, isRest: true)` (`setRestDay`).
- `workoutSession.status: 'complete'` is what makes the day workout editable.

## Changes

- `shared/interfaces/api/day-log-api.interface.ts`: `UpdateDayLogInput` += `timezone`, `status`, `workoutSession`; `UpdateDayLogResultAPI` += `status`, `workoutSessionId`, `exercises`.
- `core/apollo/day-log.queries.ts`: `UPDATE_DAY_LOG` selects `status`, `workoutSessionId`, `exercises { … }`.
- `shared/wrappers/day-log.wrapper.ts`: `wrapperUpdateDayLogApiToVM(payload, allExercises)` maps the new fields; call site in `plan-day.api.ts` passes the exercise catalog.
- `plan-day.state.ts`: `setLoadingWorkoutCreation(date, isLoading)`.
- `plan-day.domain.ts`: `createWorkout(date)` builds the unified payload, toggles loading and persists the response.
- `plan-day.service.ts`: facade `createWorkout(date)`.
- `day-workout.store.ts`: `createWorkout` delegates to `PlanDayService.createWorkout`.
- Tests: `plan-day.domain.spec.ts`, `day-log.wrapper.spec.ts`.

## Backend (done)

`wave-fit-api` accepts `status` on `UpdateDayLogInput` and persists it as a
display-only value, with no side effects (`update-day-log.use-case.ts`).
`completed: true` finalizes the day-log (`active = false`, guarantees a WS) and
`updateDayLogStatus(date, isRest)` remains the real rest path. See the backend
`sdd/day-log.spec.md` (FR-004, FR-014, BR-002, BR-003) and
`documents/domain/business-rules.md` (Tracking state semantics).

`updateDayLogStatus`/`setRestDay` stay operational. "Modificar día"
(`PlanDayService.updateWorkoutStatus`) remains **local-only**, at parity with the
week-log store.

## Validation

`npx eslint <changed files>`, `npm run build`. `npm test` is currently blocked by
pre-existing stale scaffold specs unrelated to this change.
