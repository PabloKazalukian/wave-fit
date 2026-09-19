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
- **FR-006** Day status transitions: `setRestDay(day, workout, desiredStatus)` (REST/NOT_STARTED), `updateWorkoutStatus(date, status)` (COMPLETE/EDITED/REST). **Note:** `updateWorkoutStatus` (EDITED/COMPLETE) only updates local state + localStorage; it does NOT persist to the API. Only the REST/NOT_STARTED branch persists via `setRestDay` → `updateDayWorkoutStatus`.
- **FR-007** Extra sessions are added/removed through `updateExtraSession(date, form)` / `removeExtraSession(date, id)` (week-log day payload).
- **FR-008** `updateWorkoutSession(date, workout)` persists a full edited workout via `WorkoutApi`.
- **FR-009** `setRemoveAllExercises(date)` / `removeWorkoutSession(date, id)` clear the day.
- **FR-010** `completeTracking(complete)` closes the week (`completed`, `active:false`), pads the 7 days, clears state/storage, and redirects to `/my-week/success`.
- **FR-011** `createRoutineFromWorkout(title, exerciseIds)` creates a routine from a workout.
- **FR-012** History: `findAll(limit, offset)`, `findById(id)`, `removeTracking(id)` on `/user/trackings`, `/user/trackings/:id`, `/user/trackings/stats` (powered by `TrackingListState`, incl. `getStats()`). **Note:** the GraphQL operations are named `findOne` and `removeWeekLog` respectively.
- **FR-013** Day-level widgets consume the **`WorkoutStore`** contract (week impl = `WorkoutStateService`), selected via `ActiveTracking.isDayLogActive()`.

### BR

`BR-001` (active container exclusivity), `BR-003` (LocalDate), `BR-011` (completing deactivates), `BR-012` (offline-first), `BR-013` (active element state) apply.

### NFR

- **NFR-001** Exercise edits must not saturate the API (4s debounce).
- **NFR-002** Offline edits queue and replay on reconnect (`UpdateWeekLogDay` handler).
- **NFR-003** **Network-first with write-only caching:** All tracking API calls use `fetchPolicy: 'no-cache'`. IndexedDB and localStorage are write-only (populated but never read back for initialization). The localStorage fast-path is commented out. The app always hits the network on startup; offline cold start cannot render cached tracking data.

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
├── PlanTrackingStateService (plan-tracking.state.ts)     — signals + BehaviorSubject + IndexedDB (write-only)
├── PlanTrackingStorage (plan-tracking/storage/…)         — localStorage (write-only; read path commented out)
└── TrackingListState (tracking-list.state.ts)            — history/stats
```

UI tree (week mode): `MyWeek → TrackingWeekComponent → InfoCard, WeeklyStats, NavigatorWeek, ExtraSessionForm, TrackingWorkoutComponent → WorkoutDayStats/ExtraSessionContent + status switch (WorkoutCompleteList | WorkoutEdition | WorkoutInProgress → WorkoutActionsMenu → WorkoutRoutineSelector)`.

**Extra UI not in original spec:**
- `TrackingActiveComponent` — used on home and user pages (not on `/my-week`); shows "Seguimiento: Día activo / Semana activa / No iniciado" card.
- `WeeklyStats` carousel and `WorkoutDayStats` compute calories/records/streaks/muscle groups.
- `MyWeek` page also hosts day-log CTAs and a day mode (`startDay()`).

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
    extras?: string[]; // declared but never populated by the wrapper
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
    isFavorite?: boolean; // extra field, not in original spec
}

interface ExtraActivityVM {
    // extra entity, not in original spec
    id: string;
    name: string;
    type: string;
}
```

## Files

```
src/app/core/services/trackings/
├── plan-tracking.service.ts            # facade
├── plan-tracking.domain.ts             # domain
├── plan-tracking.state.ts              # state (+ IndexedDB — write-only)
├── tracking-list.state.ts              # history/stats
├── active-tracking.service.ts          # source of truth
├── active-tracking.api.ts              # activeTracking query
└── plan-tracking/
    ├── api/plan-tranking.api.ts        # GraphQL (legacy typo in filename preserved)
    └── storage/plan-tracking.storage.ts # localStorage (write-only)
src/app/core/services/workouts/
├── workout.state.ts                    # WorkoutStore (week impl)
├── workout-store.interface.ts          # WORKOUT_STORE token
├── workout-store.mode.ts               # isDayLogActive()
└── api/workout.api.ts
src/app/core/apollo/tracking.queries.ts
src/app/shared/interfaces/tracking.interface.ts
src/app/shared/interfaces/api/tracking-api.interface.ts
src/app/shared/wrappers/tracking.wrapper.ts
src/app/pages/my-week/  (my-week, success/)
src/app/pages/trackings/ (trackings, show/, stats/)
src/app/shared/components/widgets/tracking/  (tracking-week, tracking-day, tracking-workout, tracking-active, users/weekly-trackings, users/daily-tracking)
```

## Known issues

### Data flow
- **Double init fetch:** Both `PlanTrackingService` and `PlanTrackingDomainService` run effects on login that call `initTracking`, potentially firing the week-log query twice.
- **Two divergent "active" sources:** `ActiveTrackingApi` queries `activeTracking` (returns `hasActive/types`) while `PlanTrackingApi.getTrackingByUser` queries `activeWeekLog` (returns `hasActiveWeek/week`). These can theoretically disagree.
- **Inverted signal name:** `hasActiveTracking` in `my-week.ts` actually means "no active tracking" (template shows the week only when `!this.hasActiveTracking()`). Behavior is correct; naming is inverted.
- **Overloaded `planId`:** `show.ts` swaps `tracking.planId` for the plan **name** and displays it — field is overloaded as a display label.

### Dead code
- 4 unused GraphQL mutations in `tracking.queries.ts`: `CREATE_WORKOUT_SESSION` (duplicate of the one in `workout.queries.ts`), `UPDATE_WEEK_LOG_WORKOUT_SESSION`, `SYNC_WEEK_LOG_DAYS`, `ASSIGN_ROUTINE_TO_DAYS` (unused duplicate of singular `ASSIGN_ROUTINE_TO_DAY`).
- Commented-out legacy `REMOVE_WORKOUT_SESSION_FROM_DAY`.
- `setRestDay` ignores its `workout` parameter (only reads `desiredStatus`).
- `navigator-week.ts` injects `WorkoutStateService` directly instead of using `WORKOUT_STORE` token.

### Debug artifacts
- `console.log` at `plan-tranking.api.ts:57` — copy-paste label `[PLAN_DAY_API]` inside the week-log API.
- `console.log` at `plan-tranking.api.ts:93-94, 114`.
- `console.log` at `plan-tracking.domain.ts:332-333`.

### Interface drift
- `TrackingVMS.extras` is declared but never populated by the wrapper (`tracking.wrapper.ts`).
- `TrackingCreate.completed?` exists in the API interface but is not part of the spec's create signature.
- `workout.api.ts:43` `wrapperWorkoutSessionVMToApi` returns `any`.

### Tests
- The former `plan-tracking.spec.ts` (broken import) was removed and the mistitled `tracking-week.spec.ts` / `tracking-workout.spec.ts` describes were renamed; tracking coverage now lives in the domain/facade/wrapper/store specs (see ## Tests).

## Tests

- **TEST-001** `createTracking` builds the current-week range and persists. ✅ (`plan-tracking.domain.spec.ts`)
- **TEST-002** `setExercises` debounces and enqueues `UpdateWeekLogDay` offline. ✅ (`plan-tracking.service.spec.ts`, `plan-tracking.domain.spec.ts`)
- **TEST-003** Day status transitions map REST/COMPLETE/EDITED correctly. ✅ (`plan-tracking.domain.spec.ts`, `plan-tracking.service.spec.ts`)
- **TEST-004** `completeTracking` deactivates + cleans state/storage. ✅ (`plan-tracking.domain.spec.ts`)
- **TEST-005** Wrappers convert ISO → `LocalDate` per user timezone. ✅ (`tracking.wrapper.spec.ts`)
- **TEST-006** `WorkoutStateService` satisfies the `WorkoutStore` contract (week mode). ✅ (`workout.state.spec.ts`)

## Acceptance Criteria

- **AC-001** The user can start a week and train day by day with sets/reps/weights. ✅
- **AC-002** Rest days, complete/edited statuses, and exercise clearing work per day. ✅ (edited/complete are local-only until next API persist)
- **AC-003** Extra sessions are attached to the active week-log day. ✅
- **AC-004** Completing the week redirects to success and history reflects it. ✅
- **AC-005** Offline modifications replay once connectivity returns. ✅ (only for `UpdateWeekLogDay`)
