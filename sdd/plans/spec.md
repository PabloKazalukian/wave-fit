# Plans (Weekly Routine Template)

## Context

A **RoutinePlan** is a weekly training plan (TEMPLATE branch) that groups up to 7 routine days (Monday–Sunday). Each day is a `RoutineDay` with `kind` WORKOUT/REST and a list of exercises. The feature spans the plans list (`/plans`) and the visual weekly planner (`/plans/create`).

## Requirements

### FR: Functionality

- **FR-001** List existing plans on `/plans`.
- **FR-002** `/plans/create` renders `RoutinePlanForm` (name/description/distribution) which reveals `WeeklyRoutinePlannerComponent`: one `WeekDayCellComponent` per day, a `DayOfRoutine` editor and a `DaysRoutineProgress` bar; the per-day exercise editor is `RoutineListBoxComponent` embedded in each day cell.
- **FR-003** Day-level state lives in `PlansService` (`setDayRoutine`, `setExpandedDay`, `removeDayRoutine`, `setWeeklyDistribution`, `setDayRoutines`); `DayPlanStateService` composes them for the active day (`setDay`, `setKind` → `PlansService.setDayRoutine`). `PlansService.setKindRoutineDay` exists but is unused (dead code).
- **FR-004** `PlansService` exposes the in-memory plan (`currentValue()`, `routinePlanVM$`) and `PlansApiService` provides `createPlan`, `getRoutinePlanById`, `validateTitleUnique` (its `getPlans` is unused: the `/plans` list is served by `RoutinesService.getRoutinesPlans()`); `PlansStorageService` persists locally (localStorage, key `routine_plan:<userId>`) and the offline sync queue uses IndexedDB.
- **FR-005** `submitPlan()` finalizes the plan: online it calls `PlansApiService.createPlan`; offline it generates a local ObjectId, enqueues a single `CreateRoutinePlan` sync operation, and returns the local id. Days are sent as IDs via `RoutinePlanSend`, so no per-day operations are enqueued (the `CreateRoutineDay` handler belongs to the routines flow).
- **FR-006** `validateTitleUnique` guards duplicate plan names.
- **FR-007** `removePlan()` clears the local plan state/storage only (no id parameter, no remote delete mutation).
- **FR-008** After creating a plan the app navigates to `/routines/show/:id` (not `/routines/create`).
- **FR-009** Facades coordinate the views: `RoutinePlanFormFacade`, `RoutineListBoxFacade`, `RoutineExerciseFormFacade`, `ExerciseCreateFacade`, `ExercisesTableFacade`.

### BR

- **BR-002** (template branch), **BR-004**, **BR-006** (`routineDays` are day IDs when sending), **BR-007** apply.

### NFR

- **NFR-001** Planner interactions are reactive per day (signal/BehaviorSubject) without page reload.
- **NFR-002** Offline plan creation is not lost and syncs after reconnect.

## Constraints

- Plans are **templates**; represent planned training, not executed sessions.
- The active-day coordination uses `DayPlanStateService` (composes `PlansService` day edits + `RoutinesService` catalog; not a pure state container — the raw day-state methods live in `PlansService`).
- Plans use `PlansStorageService` (localStorage) alongside IndexedDB sync for offline.

## Architecture

```
PlansService (core/services/plans/plans.service.ts)              — orchestration + state edits
├── DayPlanStateService (core/services/plans/day-plan-state.service.ts) — active day state
├── PlansApiService (core/services/plans/api/plans.api.ts)         — GraphQL
└── PlansStorageService (core/services/plans/storage/plans.storage.ts) — localStorage

/plans/create
└── RoutinePlanForm (name/description/distribution)  → routine-form.facade (RoutinePlanFormFacade)
      └── WeeklyRoutinePlannerComponent
            ├── DaysRoutineProgress
            ├── DayOfRoutine
            └── WeekDayCellComponent → RoutineListBoxComponent (per-day exercise editor)
```

## Data contract

```ts
type DayIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface RoutinePlan {
    id?: string;
    name: string;
    description: string;
    weekly_distribution: string;
    routineDays: RoutineDay[];
    createdBy?: string;
}

interface RoutinePlanVM {
    id?: string;
    name: string;
    description: string;
    weekly_distribution: string;
    routineDays: RoutineDayVM[];
    createdBy?: string;
    isAiGenerated?: boolean | null;
}

interface RoutinePlanSend {
    name: string;
    description: string;
    weekly_distribution: string;
    routineDays: string[] | null[]; // DAY IDs, not objects (BR-006)
    createdBy?: string;
}
```

> Wrapper `wrapperRoutinePlanVMtoRoutinePlan` maps `name`, `description`, `weekly_distribution`, `routineDays` (day IDs, `''` when missing) and `createdBy` — it does **not** map `id` (BR-006).

## Files

```
src/app/core/services/plans/plans.service.ts
src/app/core/services/plans/day-plan-state.service.ts
src/app/core/services/plans/api/plans.api.ts
src/app/core/services/plans/storage/plans.storage.ts
src/app/core/apollo/plans.queries.ts
src/app/shared/wrappers/plans.wrapper.ts
src/app/shared/interfaces/routines.interface.ts   (RoutinePlan* types)
src/app/pages/plans/  (plans.ts, create/)
src/app/shared/components/widgets/plans/          (weekly-routine-planner, routine-days-progress, day-of-routine, week-day-cell, routine-form)
```

## Tests

- **TEST-001** `validateTitleUnique` rejects duplicates.
- **TEST-002** `submitPlan` online calls `createPlan` and updates cache/storage.
- **TEST-003** `submitPlan` offline enqueues `CreateRoutinePlan` (+ day ops) without losing data.
- **TEST-004** Day-plan state edits (kind/expand/remove) update the reactive model.
- **TEST-005** `RoutinePlanSend` maps `routineDays` to day IDs.

## Acceptance Criteria

- **AC-001** A user can build a 7-day plan in the planner and submit it.
- **AC-002** Posted plan navigates to the routine detail page.
- **AC-003** Duplicate plan titles are blocked.
- **AC-004** Offline submission queues the plan for sync without data loss.
