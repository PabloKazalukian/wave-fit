# Tracking (Week-log)

## Context

Week-log tracking records one executed week of training (TRACKING branch). A `TrackingVM` container holds seven `WorkoutSessionVM` day records with exercise performances (sets of reps/weights). The main UI is `/my-week`; history is on `/user/trackings*` and `/my-week/success`.

## Requirements

### FR: Functionality

- **FR-001** `/my-week` shows the active week when a `WEEK_LOG` container is active (source of truth: `ActiveTracking`); otherwise it offers coach/plans/start CTA cards and a week/day mode selector.
- **FR-002** `createTracking(planId?)` starts a week-log for the current week range (`LocalDate` + timezone).
- **FR-003** `reloadTracking()` re-fetches the active week bypassing the cache.
- **FR-004** Day drill: `createWorkout(dateWorkout)` marks a day complete; `createWorkoutWithRoutine(routineDayId, date)` seeds a day from a routine.
- **FR-005** Exercises are edited via `setExercises(date, exercises)` with `debounceTime(4000)` persistence; offline edits enqueue `UpdateWeekLogDay`.
- **FR-006** Day status transitions: `setRestDay(day, workout, desiredStatus)` (REST/NOT_STARTED), `updateWorkoutStatus(date, status)` (COMPLETE/EDITED/REST).
- **FR-007** Extra sessions are added/removed through `updateExtraSession(date, form)` / `removeExtraSession(date, id)` (week-log day payload).
- **FR-008** `updateWorkoutSession(date, workout)` persists a full edited workout via `WorkoutApi`.
- **FR-009** `setRemoveAllExercises(date)` / `removeWorkoutSession(date, id)` clear the day.
- **FR-010** `completeTracking(complete)` closes the week (`completed`, `active:false`), pads the 7 days, clears state/storage, and redirects to `/my-week/success`.
- **FR-011** `createRoutineFromWorkout(title, exerciseIds)` creates a routine from a workout.
- **FR-012** History: `findAll(limit, offset)`, `findById(id)`, `removeTracking(id)` on `/user/trackings`, `/user/trackings/:id`, `/user/trackings/stats` (powered by `TrackingListState`, incl. `getStats()`).
- **FR-013** Day-level widgets consume the **`WorkoutStore`** contract (week impl = `WorkoutStateService`), selected via `ActiveTracking.isDayLogActive()`.

### BR

`BR-001` (active container exclusivity), `BR-003` (LocalDate), `BR-011` (completing deactivates), `BR-012` (offline-first), `BR-013` (active element state) apply.

### NFR

- **NFR-001** Exercise edits must not saturate the API (4s debounce).
- **NFR-002** Offline edits queue and replay on reconnect (`UpdateWeekLogDay` handler).
- **NFR-003** Cache-first: in-memory `BehaviorSubject` + IndexedDB; API only when no cache or on force reload.

## Constraints

- The API file is named `plan-tranking.api.ts` (legacy typo; do not rename in a behavior change).
- Dates are `LocalDate` in VMs; wrappers convert ISO → `LocalDate` with the user's timezone.
- `WorkoutApi.updateWorkoutSession` targets the **week-log day** workout session.
- Success page uses `WeeklyTrackings` widget + `TrackingListState`.

## Architecture

```
ActiveTrackingService ──► mode ('week') ──► WORKOUT_STORE token → WorkoutStateService
                                                   │
PlanTrackingService (facade) — core/services/trackings/plan-tracking.service.ts
├── PlanTrackingDomainService (plan-tracking.domain.ts)  — business logic + offline handler 'UpdateWeekLogDay'
│     ├── PlanTrackingApi (plan-tracking/api/plan-tranking.api.ts)   — GraphQL
│     ├── WorkoutApi (workouts/api/workout.api.ts)
│     ├── RoutinesService (createRoutineFromWorkout)
│     └── SyncQueueService / NetworkStatusService
├── PlanTrackingStateService (plan-tracking.state.ts)     — signals + BehaviorSubject + IndexedDB
├── PlanTrackingStorage (plan-tracking/storage/…)         — localStorage
└── TrackingListState (tracking-list.state.ts)            — history/stats
```

UI tree (week mode): `MyWeek → TrackingWeekComponent → InfoCard, WeeklyStats, NavigatorWeek, ExtraSessionForm, TrackingWorkoutComponent → WorkoutDayStats/ExtraSessionContent + status switch (WorkoutCompleteList | WorkoutEdition | WorkoutInProgress → WorkoutActionsMenu → WorkoutRoutineSelector)`.

## Data contract

```ts
type LocalDate = string; // "yyyy-MM-dd"
type DayStatusVM = 'pending' | 'complete' | 'skipped';
type StatusWorkoutSession = 'not_started' | 'complete' | 'rest' | 'edited';
enum StatusWorkoutSessionEnum {
    NOT_STARTED = 'not_started',
    REST = 'rest',
    COMPLETE = 'complete',
    EDITED = 'edited',
}

interface TrackingVM {
    id: string;
    userId: string;
    startDate: LocalDate;
    endDate: LocalDate;
    workouts?: WorkoutSessionVM[]; // workout branch (not `days`)
    planId?: string | null;
    notes?: string;
    completed: boolean;
}

interface TrackingVMS {
    // WeekLog variant with `days`
    id: string;
    userId: string;
    startDate: LocalDate;
    endDate: LocalDate;
    planId?: string | null;
    days: WeekLogDayVM[];
    completed: boolean;
    notes?: string;
    workouts?: WorkoutSessionVM[];
    extras?: string[];
}

interface WeekLogDayVM {
    order: number;
    date: LocalDate;
    isRest: boolean;
    workoutSessionId?: string | null;
    exercises: ExercisePerformanceVM[];
    extraSessionIds: string[];
    status: DayStatusVM;
}

interface WorkoutSessionVM {
    id?: string;
    date: LocalDate;
    exercises: ExercisePerformanceVM[];
    extras?: string[];
    status: StatusWorkoutSession;
    notes?: string;
    planId?: string;
}

interface ExercisePerformanceVM {
    exerciseId: string;
    name: string;
    series: number;
    category: ExerciseCategory;
    sets: { reps: number; weights?: number }[];
    usesWeight: boolean;
    notes?: string;
}
```

## Files

```
src/app/core/services/trackings/
├── plan-tracking.service.ts            # facade
├── plan-tracking.domain.ts             # domain
├── plan-tracking.state.ts              # state (+ IndexedDB)
├── tracking-list.state.ts              # history/stats
├── active-tracking.{service,api}.ts    # source of truth
└── plan-tracking/{api/plan-tranking.api.ts, storage/plan-tracking.storage.ts}
src/app/core/services/workouts/workout.state.ts        # WorkoutStore (week impl)
src/app/core/services/workouts/api/workout.api.ts
src/app/core/apollo/tracking.queries.ts
src/app/shared/interfaces/tracking.interface.ts
src/app/shared/wrappers/tracking.wrapper.ts
src/app/pages/my-week/  (my-week, success/)
src/app/pages/trackings/ (trackings, show/, stats/)
src/app/shared/components/widgets/tracking/
```

## Tests

- **TEST-001** `createTracking` builds the current-week range and persists.
- **TEST-002** `setExercises` debounces and enqueues `UpdateWeekLogDay` offline.
- **TEST-003** Day status transitions map REST/COMPLETE/EDITED correctly.
- **TEST-004** `completeTracking` deactivates + cleans state/storage.
- **TEST-005** Wrappers convert ISO → `LocalDate` per user timezone.
- **TEST-006** `WorkoutStateService` satisfies the `WorkoutStore` contract (week mode).

## Acceptance Criteria

- **AC-001** The user can start a week and train day by day with sets/reps/weights.
- **AC-002** Rest days, complete/edited statuses, and exercise clearing work per day.
- **AC-003** Extra sessions are attached to the active week-log day.
- **AC-004** Completing the week redirects to success and history reflects it.
- **AC-005** Offline modifications replay once connectivity returns.
