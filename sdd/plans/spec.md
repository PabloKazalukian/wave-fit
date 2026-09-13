# Plans (Weekly Routine Template)

## Context

A **RoutinePlan** is a weekly training plan (TEMPLATE branch) that groups up to 7 routine days (Monday–Sunday). Each day is a `RoutineDay` with `kind` WORKOUT/REST and a list of exercises. The feature spans the plans list (`/plans`) and the visual weekly planner (`/plans/create`).

## Requirements

### FR: Functionality

- **FR-001** List existing plans on `/plans`.
- **FR-002** `/plans/create` renders the weekly planner: one cell per day (`WeekDayCell`), a day-of-routine editor, and a `RoutineForm` per day.
- **FR-003** The planner supports per-day state: set a routine day (`setDayRoutine`), set its kind (`setKindRoutineDay`), expand/collapse days (`setExpandedDay`), remove a day (`removeDayRoutine`), manage `weekly_distribution`.
- **FR-004** `PlansService` keeps an in-memory plan (`currentValue`), uses `plans` cache via `PlansApiService` (`getPlans`, `getRoutinePlanById`, `validateTitleUnique`), and persists locally via `PlansStorageService` (localStorage) under the user scope.
- **FR-005** `submitPlan()` finalizes the plan: online it calls `createPlan`; offline it generates a local ObjectId, stores locally, and enqueues a `CreateRoutinePlan` sync operation (with `CreateRoutineDay` handlers for days).
- **FR-006** `validateTitleUnique` guards duplicate plan names.
- **FR-007** `removePlan(id)` deletes a plan.
- **FR-008** After creating a plan the app navigates to `/routines/show/:id` (not `/routines/create`).
- **FR-009** Facades coordinate the views: `RoutinePlanFormFacade`, `RoutineListBoxFacade`, `RoutineExerciseFormFacade`, `ExerciseCreateFacade`, `ExercisesTableFacade`.

### BR

- **BR-002** (template branch), **BR-004**, **BR-006** (`routineDays` are day IDs when sending), **BR-007** apply.

### NFR

- **NFR-001** Planner interactions are reactive per day (signal/BehaviorSubject) without page reload.
- **NFR-002** Offline plan creation is not lost and syncs after reconnect.

## Constraints

- Plans are **templates**; represent planned training, not executed sessions.
- The active day being edited in the planner has its own state service (`DayPlanStateService`, media complexity: pure State).
- Plans use `PlansStorageService` (localStorage) alongside IndexedDB sync for offline.

## Architecture

```
PlansService (core/services/plans/plans.service.ts)              — orchestration + state edits
├── DayPlanStateService (core/services/plans/day-plan-state.service.ts) — active day state
├── PlansApiService (core/services/plans/api/plans.api.ts)         — GraphQL
└── PlansStorageService (core/services/plans/storage/plans.storage.ts) — localStorage

/plans/create
└── WeeklyRoutinePlannerComponent
      ├── DaysRoutineProgressComponent
      ├── DayOfRoutineComponent
      └── WeekDayCellComponent → RoutineFormComponent (+ routine-form.facade)
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

> Wrapper `wrapperRoutinePlanVMtoRoutinePlan` maps only `id/name/description/weekly_distribution/createdBy`.

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
src/app/shared/components/widgets/plans/          (weekly-routine-planner, day-of-routine, week-day-cell, routine-form)
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
