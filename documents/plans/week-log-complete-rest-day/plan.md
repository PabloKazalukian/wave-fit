# Plan: Week-log `createWorkout` — omit empty `workoutSession.id`

## Context

Completing a week-log day ("Completar el día") fails with
`days.0.workoutSession.id must be a mongodb id` when the day was previously a
rest day (or has no workout session materialized yet).

Root cause chain:

1. Rest day → backend returns `workoutSessionId: null`.
2. `wrapperWeekLogDayVMToWorkoutVM` (`tracking.wrapper.ts:180`) maps it to
   `id: ''` (`?? ''`).
3. `setRestDay(..., false)` (REST → NOT_STARTED) only rewrites `status`; `id`
   stays `''`.
4. `PlanTrackingDomainService.createWorkout` (`plan-tracking.domain.ts:160`)
   sends `workoutSession.id` **unconditionally** → `''` reaches the backend,
   which rejects it as an invalid mongodb id.

The day-log branch already guards this with a conditional spread
(`plan-day.domain.ts:165`).

## Decision

Replicate the day-log guard in the week-log branch:

```ts
workoutSession: {
    ...(workoutDraft.id ? { id: workoutDraft.id } : {}),
    date,
    status: 'complete',
    exercises,
    notes,
},
```

An empty `id` means "no session yet" → omit it so the backend creates one.

Hardening: `wrapperWorkoutSessionVMtoUpdateWeekLogDayInput` uses
`w.id ?? undefined`, which does not filter `''`. Normalize falsy ids to
`undefined` so no other payload path (e.g. `completeTracking`) can leak `''`.

Debug aid: label the existing `console.log(payload)` in
`plan-tranking.api.ts` (`[UPDATE_WEEK_LOG_DAY]`) so the outgoing payload is
identifiable in the console while completing a day.

## Changes

- `core/services/trackings/plan-tracking.domain.ts`: conditional spread of
  `workoutSession.id` in `createWorkout`.
- `shared/wrappers/tracking.wrapper.ts`: `w.id || undefined` in
  `wrapperWorkoutSessionVMtoUpdateWeekLogDayInput`.
- `core/services/trackings/plan-tracking/api/plan-tranking.api.ts`: labeled
  `console.log` in `updateTrackingDay`.
- Tests: `plan-tracking.domain.spec.ts` (payload omits `id` when empty, keeps
  it when present), `tracking.wrapper.spec.ts` (falsy id → `undefined`).

## Validation

`npm run lint`, `npm test`.
