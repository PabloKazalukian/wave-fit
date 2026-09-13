# Day-log

## Context

The day-log is the **single-day** tracking container (TRACKING branch). Unlike the week-log (which nests `days[]`), the day-log is a **flat** model: one global workout session, extra-session ids, status and completion flags at the root. It is the active container when `ActiveTracking.type === 'DAY_LOG'`.

## Requirements

### FR: Functionality

- **FR-001** Start/active routing: `/my-day` shows the active day-log; when no container is active, `/my-week` offers the week/day mode selector.
- **FR-002** `/my-day/success` is shown after the day-log is completed.
- **FR-003** `PlanDayService` (facade) exposes the day-log container, state and persistence: `core/services/day-logs/plan-day.{service,domain,state}.ts` + `plan-day/storage/plan-day.storage.ts`.
- **FR-004** `createDayLog(CreateDayLogInput)` creates a day-log for a `LocalDate` (requires `timezone` IANA).
- **FR-005** `updateDayLog(UpdateDayLogInput)` persists notes/completed/extra-session for the single day.
- **FR-006** `updateDayLogStatus` transitions day status (`pending|complete|skipped`) and returns the mutation id/status/`workoutSessionId`.
- **FR-007** `assignRoutineToDayLog` seeds the day from a routine day (`routineDayId`), returning the session exercise performances.
- **FR-008** `removeWorkoutSessionFromDayLog` clears the global session (id, status).
- **FR-009** `removeExtraSessionFromDayLog` detaches an extra session id.
- **FR-010** Offline mutations update local state and enqueue sync in `plan-day.domain.ts` (BR-012).
- **FR-011** Day exercises/session are driven through the **`WorkoutStore`** contract with the day implementation = `DayWorkoutStore` (`core/services/workouts/day-workout.store.ts`), selected via `ActiveTracking.isDayLogActive()`.
- **FR-012** History: day-logs appear in `/user/trackings` via `DayLogs` query (`DayLogSummaryVM[]`); the show page renders a completed day-log.

### BR

`BR-001`, `BR-002`, `BR-009` (flat model + deletion from the day-log container), `BR-011`, `BR-012`, `BR-013` apply.

### NFR

- **NFR-001** Wrappers convert Mongo ISO dates → `LocalDate` (user timezone), never passing ISO to VMs.
- **NFR-002** Completed day-log is idempotent (no duplicate closing).

## Constraints

- The day-log is **flat**: single `workoutSessionId`/`exercises[]` at root; do not nest `days[]`.
- Deleting a workout or extra session happens **from the day-log container** (BR-009).
- `CreateDayLogInput` always requires `timezone`.
- ActiveTracking fields (`hasActive`,`type`,`week?`,`day?`) are the start-up source of truth.

## Architecture

```
ActiveTrackingService ──► DAY_LOG ──► WORKOUT_STORE token → DayWorkoutStore (day impl)
                                                   │
PlanDayService (core/services/day-logs/plan-day.service.ts)   — facade
├── PlanDayDomainService (plan-day.domain.ts)                 — business logic + offline sync enqueue
├── PlanDayStateService (plan-day.state.ts)                   — reactive container (BehaviorSubject/signals)
├── PlanDayApiService (plan-day/api/plan-day.api.ts)          — GraphQL (day-log.queries)
└── PlanDayStorageService (plan-day/storage/plan-day.storage.ts) — local persistence
```

Pages: `/my-day` (`MyDay`) → `TrackedDayComponent` (title card, `WorkoutDayStats`, extra-session, status switch), `/my-day/success` (`Success`). History: `/user/trackings` list + show page (week-log and day-log both rendered).

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
export interface UpdateDayLogInput {
    id: string;
    completed?: boolean;
    notes?: string;
    extraSession?: CreateExtraSessionWithoutWsInput;
}
```

## Files

```
src/app/core/apollo/day-log.queries.ts
src/app/core/apollo/day-log.queries.ts   (includes ACTIVE_TRACKING)
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
src/app/pages/trackings/  (list, show/, stats/)
```

## Tests

- **TEST-001** Wrapper converts `DayLogAPI.date` (ISO) → `LocalDate` per timezone.
- **TEST-002** `createDayLog` sends `timezone`; offline enqueue `CreateDayLog` sync op.
- **TEST-003** `assignRoutineToDayLog` seeds exercises from a routine day.
- **TEST-004** `removeWorkoutSessionFromDayLog` empties the flat session (id + status).
- **TEST-005** Completing the day-log flips `active`/`completed` and redirects to success.
- **TEST-006** `DayWorkoutStore` satisfies the `WorkoutStore` contract for day mode.

## Acceptance Criteria

- **AC-001** The user can create and train a single day (`/my-day`) independently of a week.
- **AC-002** Week/day selection honors `ActiveTracking`; a prior active container takes precedence over `DistributionDays`.
- **AC-003** Day sessions, extra sessions and status are editable and survive offline.
- **AC-004** Completed day-logs appear in history and render read-only on the show page.
