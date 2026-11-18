# Day-log

## Context

The day-log is the **single-day** tracking container (TRACKING branch). Unlike the week-log (which nests `days[]`), the day-log is a **flat** model: one global workout session, extra-session ids, status and completion flags at the root. It is the active container when `ActiveTracking.type === 'DAY_LOG'`.

## Requirements

### FR: Functionality

- **FR-001** Start/active routing: `/my-day` shows the active day-log; when no container is active, `/my-week` offers the week/day mode selector.
- **FR-002** `/my-day/success` is shown after the day-log is completed.
- **FR-003** `PlanDayService` (facade) exposes the day-log container, state and persistence: `core/services/day-logs/plan-day.{service,domain,state}.ts` + `plan-day/storage/plan-day.storage.ts`.
- **FR-004** `createDayLog(planId?, date?, routineDayId?)` (facade) creates a day-log for a `LocalDate`; it builds `CreateDayLogInput` with the user timezone (IANA) in the domain layer.
- **FR-005** `PlanDayApi.updateDayLog(UpdateDayLogInput)` persists the single day in one unified mutation: `status`, `completed`, `notes`, `extraSession` and `workoutSession` (creates/updates the global WS, including its `exercises`, in the same call). The facade reaches it via `completeDayLog`, `updateExtraSession` and `createWorkout`. `timezone` is sent when the day has no WS yet. This input mirrors the week-log `days[].status`/`workoutSession` contract (parity with the backend week-log update). It is the **only** mutation that persists a day-log workout session, in both active and deferred editing (FR-014); `UpdateWorkoutSession` is week-log-only.
- **FR-006** `PlanDayApi.updateDayLogStatus(date, isRest)` transitions day status and returns `{ id, status, workoutSessionId, active }`; the facade wraps it as `setRestDay`. `DayWorkoutStore.createWorkout` (the "Completar el día" flow) instead goes through `PlanDayService.createWorkout` → FR-005: it sends `status: 'complete'` + `workoutSession.status: 'complete'` (with the day exercises) and **leaves `completed` untouched**, so the workout becomes editable while the day stays open. In `updateDayLog`, day-log `status` is a **display-only** value persisted as-is (no side effects on `completed`, `active` or the WS) and is never inferred by the backend; `completed: true` is the **only** day-closing action (`completeDayLog` → `active = false` → `/my-day/success`).
- **FR-007** `PlanDayApi.assignRoutineToDayLog(routineDayId, date)` seeds the day from a routine day; the facade exposes it as `createWorkoutWithRoutine`.
- **FR-008** `PlanDayApi.removeWorkoutSessionFromDayLog(workoutSessionId)` clears the global session; the facade exposes it as `removeWorkoutSession`.
- **FR-009** `PlanDayApi.removeExtraSessionFromDayLog(extraSessionId)` detaches an extra session from an **active** day-log via `RemoveExtraSessionFromDayLog($extraSessionId: String!)`; the backend rejects `workoutSessionId` with a validation error. For deferred (`active: false`) day-logs, `PlanDayApi.removeExtraSessionFromDeferredDayLog(extraSessionId)` uses `RemoveExtraSessionFromDeferredDayLog($extraSessionId: String!)` and never merges into active state. The facade exposes both as `removeExtraSession` / `removeExtraSessionDeferred`.
- **FR-010** Offline updates run through the `UpdateDayLog` sync operation registered in `plan-day.domain.ts` (enqueued by `updateExercises`); there is no offline path for create/status/assign/remove (no `CreateDayLog` sync op).
- **FR-011** Day exercises/session are driven through the **`WorkoutStore`** contract with the day implementation = `DayWorkoutStore` (`core/services/workouts/day-workout.store.ts`), selected via `ActiveTracking.isDayLogActive()`.
- **FR-012** History: day-logs appear as `DayLogSummaryVM[]` via the `DayLogs` query (`dayLogFindAll`) consumed by the `DailyTracking` widget on `/user`; a completed day-log is rendered read-only at `/user/tracking/day/:id` (`pages/tracking-day/show`). `/user/trackings` lists week-logs only.
- **FR-014** Editing a day-log workout session — active or deferred — persists the complete WS through `updateDayLog({ id, workoutSession })`, with the existing WS id carried in `workoutSession.id`. No day-log edit calls `UpdateWorkoutSession`. Deferred calls keep `updateActiveState: false`: they do not write active day-log state, active tracking state or local storage.
- **FR-015** Deferred extra-session writes target the day-log explicitly: creates use `UpdateDayLogInput.id` from the loaded deferred container instead of deriving it from `ActiveTracking`; deletions send the extra-session id (FR-009). The shared form only validates and emits; the container owner performs the mutation. Neither path writes active state or local storage.

### BR

`BR-001`, `BR-002`, `BR-009` (flat model + deletion from the day-log container), `BR-011`, `BR-012`, `BR-013` apply.

### NFR

- **NFR-001** Wrappers convert Mongo ISO dates → `LocalDate` (user timezone), never passing ISO to VMs.
- **NFR-002** Completed day-log is idempotent (no duplicate closing).

## Constraints

- The day-log is **flat**: single `workoutSessionId`/`exercises[]` at root; do not nest `days[]`.
- Deleting a workout or extra session happens **from the day-log container** (BR-009).
- `CreateDayLogInput` always requires `timezone`.
- `CreateDayLogDeferredInput` requires a past `date`; `timezone` is optional (backend default).
- Deferred creation (FR-013) must not write container state, local storage or active tracking.
- ActiveTracking fields (`hasActive`,`type`,`week?`,`day?`) are the start-up source of truth.

## Architecture

```
ActiveTrackingService ──► DAY_LOG ──► WORKOUT_STORE token → DayWorkoutStore (day impl)
                                                   │
PlanDayService (core/services/day-logs/plan-day.service.ts)   — facade
├── PlanDayDomainService (plan-day.domain.ts)                 — business logic + offline sync enqueue
├── PlanDayStateService (plan-day.state.ts)                   — reactive container (BehaviorSubject/signals)
├── PlanDayApi (plan-day/api/plan-day.api.ts)                — GraphQL (day-log.queries)
└── PlanDayStorage (plan-day/storage/plan-day.storage.ts)    — local persistence
```

Deferred creation path (FR-013):

```
PlanDayService.createDayLogDeferred(date)
└── PlanDayDomainService.createDayLogDeferred(date)
    └── PlanDayApi.createDayLogDeferred({ date }) → CREATE_DAY_LOG_DEFERRED
```

Unlike `createDayLog`, this path does not persist into the container state,
local storage or active tracking. The response is mapped by
`wrapperDayLogDeferredApiToVM`, which keeps `date` as `yyyy-MM-dd` when the
backend already sends a LocalDate (and still handles an ISO value defensively).

Deferred WS/extra-session edit path (FR-014, FR-015):

```
DayDeferred → PlanDayService.updateWorkoutSession(workout, { updateActiveState: false })
            → PlanDayDomainService → PlanDayApi.updateDayLog({ id, workoutSession })
DayDeferred → PlanDayService.{updateExtraSessionDeferred,removeExtraSessionDeferred}
            → PlanDayApi (explicit day-log / workout-session target)
```

No branch writes `setDayLog`, `setDayLogStorage`, `markDayActive`, `WORKOUT_STORE`
or local storage.

Pages: `/my-day` (`MyDay`) → `TrackingDayComponent` (title card, `WorkoutDayStats`, extra-session, status switch), `/my-day/success` (`Success`). History: `/user/trackings` list + show page (week-log and day-log both rendered).

## Data contract

```ts
export interface DayLogVM {
    id: string;
    userId: string;
    date: LocalDate; // "yyyy-MM-dd"; never JS Date
    planId?: string | null;
    routineDayId?: string | null;
    workoutSessionId?: string;
    exercises?: ExercisePerformanceVM[];
    extraSessionIds: string[];
    status: DayStatusVM; // 'pending' | 'complete' | 'skipped'
    active: boolean;
    completed: boolean;
    notes?: string;
}

export type ActiveTrackingType = 'WEEK_LOG' | 'DAY_LOG';
export interface ActiveTrackingVM {
    hasActive: boolean;
    type: ActiveTrackingType;
    week?: ActiveWeekVM | null;
    day?: ActiveDayVM | null;
}
export interface ActiveDayVM {
    id: string;
    date: LocalDate;
    completed: boolean;
    active: boolean;
    status: DayStatusVM;
}
export interface DayLogSummaryVM {
    id: string;
    date: LocalDate;
    completed: boolean;
    active: boolean;
    status: DayStatusVM;
}

// API inputs
export interface CreateDayLogInput {
    date: LocalDate;
    timezone: string;
    planId?: string;
    routineDayId?: string;
    notes?: string;
}
export interface CreateDayLogDeferredInput {
    date: LocalDate; // "yyyy-MM-dd"; must be a past date
    timezone?: string; // IANA; backend default when omitted
    planId?: string;
    routineDayId?: string;
    notes?: string;
}
export interface DayLogDeferredAPI {
    id: string;
    userId?: string;
    date: LocalDate; // already "yyyy-MM-dd" (not Mongo ISO)
    status: DayStatusAPI;
    active: boolean;
    completed: boolean;
    notes?: string;
    workoutSessionId?: string; // always present on deferred creation
    routineDayId?: string | null;
    planId?: string | null;
}
export interface UpdateDayLogInput {
    id: string;
    timezone?: string; // IANA, required when the day has no WS yet
    status?: DayStatusAPI; // 'pending' | 'complete' | 'skipped'
    completed?: boolean;
    notes?: string;
    workoutSession?: UpdateWorkoutSessionInput; // creates/updates the global WS + exercises; id required when updating an existing WS
    extraSession?: CreateExtraSessionWithoutWsInput;
}
export interface UpdateDayLogResultAPI {
    id: string;
    status?: DayStatusAPI;
    active?: boolean;
    completed?: boolean;
    workoutSessionId?: string | null;
    notes?: string;
    extraSessionIds?: string[];
    exercises?: ExercisePerformanceAPI[];
}
```

## Files

```
src/app/core/apollo/day-log.queries.ts   (incl. ACTIVE_TRACKING, consumed by active-tracking.api.ts)
src/app/core/services/day-logs/plan-day.service.ts
src/app/core/services/day-logs/plan-day.domain.ts
src/app/core/services/day-logs/plan-day.state.ts
src/app/core/services/day-logs/plan-day/api/plan-day.api.ts
src/app/core/services/day-logs/plan-day/storage/plan-day.storage.ts
src/app/core/services/workouts/day-workout.store.ts
src/app/core/services/workouts/workout-store.interface.ts | workout-store.mode.ts
src/app/core/services/trackings/active-tracking.service.ts | active-tracking.api.ts
src/app/shared/interfaces/day-log.interface.ts
src/app/shared/interfaces/api/day-log-api.interface.ts
src/app/shared/wrappers/day-log.wrapper.ts
src/app/pages/my-day/  (+ success/)
src/app/pages/tracking-day/show/   (DayLog read-only show)
src/app/pages/trackings/  (week-log list, show/)
src/app/pages/user/history/day-deferred/   (deferred day-log demo page)
src/app/shared/components/widgets/training-history/day-deferred-form/   (legacy read-only preview widget; the deferred page hosts WorkoutSessionEditor)
src/app/shared/components/widgets/users/daily-tracking/   (DayLog summary list)
```

## Tests

- **TEST-001** Wrapper converts `DayLogAPI.date` (ISO) → `LocalDate` per timezone.
- **TEST-002** `createDayLog` sends the user `timezone` (IANA) in `CreateDayLogInput`.
- **TEST-003** `assignRoutineToDayLog` seeds exercises from a routine day.
- **TEST-004** `removeWorkoutSessionFromDayLog` empties the flat session (id + status).
- **TEST-005** Completing the day-log flips `active`/`completed` and redirects to success.
- **TEST-006** `DayWorkoutStore` satisfies the `WorkoutStore` contract for day mode.
- **FR-013** Any authenticated user (no admin role) can create an empty (deferred) day-log from the history calendar. `PlanDayService.createDayLogDeferred(date)` calls `PlanDayApi.createDayLogDeferred({ date })` → GraphQL mutation `createDayLogDeferred(input: CreateDayLogDeferredInput!)`. The backend rejects today/future dates and returns the created day-log with `date` as `yyyy-MM-dd`, `active: false`, `completed: false` and `workoutSessionId` **always present** (the backend creates the workout session). The call does not modify the active day-log state, local storage or active tracking; the facade/domain only return the created VM. `timezone` is optional (backend default `America/Argentina/Buenos_Aires`), as are `planId`, `routineDayId` and `notes`. On success the history page shows a notification, reloads the calendar month and opens the new day's empty preview; on failure it shows an error notification. The deferred page `/user/history/deferred?date=<LocalDate>&id=<dayLogId>` loads the day-log by id and renders `WorkoutSessionEditor` for WS/extra-session editing (FR-014, FR-015); its persistence rules are defined in this spec and in `sdd/add-deferred-day/spec.md`.
- **TEST-007** `createWorkout` sends `status:'complete'` + `workoutSession.status:COMPLETE` (with mapped exercises, no `completed`), stores the returned day-log and toggles the loading flag.
- **TEST-008** `createDayLogDeferred` sends `{ date }` through domain → API and does **not** call `setDayLog`, `setDayLogStorage` or `markDayActive`; the wrapper keeps `yyyy-MM-dd` without timezone conversion and normalizes optional fields. ✅
- **TEST-009** The deferred page loads the day-log by `id` and renders the demo labels; `date`-only renders the empty form; missing/invalid date, null result and fetch errors are handled. ✅
- **TEST-010** Active and deferred day-log WS edits call `UpdateDayLog` with `id` and the mapped `workoutSession` (including `id`, exercises and status); they never call `UpdateWorkoutSession` (FR-005, FR-014).
- **TEST-011** `removeExtraSessionFromDayLog` declares and sends `extraSessionId`; deferred extra-session writes do not touch active state/storage and target the loaded day-log explicitly (FR-009, FR-015).

## Acceptance Criteria

- **AC-001** The user can create and train a single day (`/my-day`) independently of a week.
- **AC-002** Week/day selection honors `ActiveTracking`; a prior active container takes precedence over `DistributionDays`.
- **AC-003** Day sessions, extra sessions and status are editable and survive offline.
- **AC-004** Completed day-logs appear in history and render read-only on the show page.
- **AC-005** Workout-session edits persist in both active and deferred day-logs through `UpdateDayLog`.
- **AC-006** Extra-session deletion from a day-log uses `extraSessionId`: active day-logs use `RemoveExtraSessionFromDayLog`, deferred day-logs use `RemoveExtraSessionFromDeferredDayLog`, and deferred writes affect only the edited deferred day (FR-009, FR-015).
