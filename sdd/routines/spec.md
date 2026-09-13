# Routines

## Context

A **RoutineDay** is a daily workout template (TEMPLATE branch): a title, optional muscle-category filter, a list of exercises, a `kind` (WORKOUT/REST), and an optional favorite flag. The routines feature manages these day templates and is consumed by plans, tracking, and the `/routines/show/:id` page.

## Requirements

### FR: Functionality

- **FR-001** Provide `/routines/show/:id` to view a routine day.
- **FR-002** `RoutinesService.getAllRoutines()` loads/caches all routine days (cache `routinesCache$` `BehaviorSubject`).
- **FR-003** `updateAllRoutines()` refreshes the cache wholesale.
- **FR-004** `getRoutineById(id)` / `getRoutinePlanById(id)` / `getRoutinesPlans()` resolve routines and plans (inline `gql`).
- **FR-005** `getRoutinesByCategory(category)` filters routines by exercise category.
- **FR-006** `createRoutine(data)` creates a routine day; offline it generates a local ObjectId, writes locally, and enqueues a `CreateRoutineDay` sync operation.
- **FR-007** `setIsFavorite(routineId, favorite)` toggles the favorite flag (BR-007).
- **FR-008** Wrappers map API ↔ VM: `wrapperRoutineDayAPItoRoutineDay(VM)`, `wrapperRoutineDayCreateToPayload`.

### BR

- **BR-004** (category normalization) and **BR-007** (favorites) apply.

### NFR

- **NFR-001** Frequent accesses reuse the cached catalog (no repeated fetches).
- **NFR-002** Offline create keeps the routine usable immediately and syncs later.

## Constraints

- Routines belong to the **TEMPLATE** branch; they never represent executed sessions.
- Kind is `REST | WORKOUT` (`KindType`).
- The `plan-id`/`routineDayId` linkage used by tracking (assign routine to day) is defined in the Tracking/Day-log specs.

## Architecture

```
RoutinesService (core/services/routines/routines.service.ts)     — cache + orchestration
└── RoutinesApiService (core/services/routines/api/routines.api.ts) — GraphQL
    └── inline gql (routines.queries) + SyncQueueService (offline CreateRoutineDay)
```

Widgets: `shared/components/widgets/routines/routine-form`, `routine-list-box`, `routine-exercise-form`.

## Data contract

```ts
type KindType = 'REST' | 'WORKOUT';
enum KindEnum {
    rest = 'REST',
    workout = 'WORKOUT',
}

interface RoutineDay {
    id: string;
    title: string;
    type?: ExerciseCategory[];
    exercises?: Exercise[];
    planId?: string;
    isFavorite?: boolean;
    kind: KindType;
}

interface RoutineDayVM {
    id?: string;
    kind?: KindType;
    title?: string;
    type?: ExerciseCategory[];
    expanded: boolean; // UI
    day: DayIndex; // 1..7
    exercises?: Exercise[];
}

interface RoutineDayCreateSend {
    title: string;
    type?: ExerciseCategory[] | string[];
    exercises?: ExerciseSend[]; // { exercise, order }
    planId?: string;
}
```

## Files

```
src/app/core/services/routines/routines.service.ts
src/app/core/services/routines/api/routines.api.ts
src/app/core/apollo/routines.queries.ts
src/app/shared/wrappers/routines.wrapper.ts
src/app/shared/interfaces/routines.interface.ts
src/app/shared/interfaces/api/routines-api.interface.ts
src/app/pages/routines/show/
src/app/shared/components/widgets/routines/
```

## Tests

- **TEST-001** `getAllRoutines` caches; `updateAllRoutines` refreshes.
- **TEST-002** `getRoutinesByCategory` filters correctly.
- **TEST-003** `createRoutine` offline enqueues `CreateRoutineDay`.
- **TEST-004** `setIsFavorite` optimistically updates the cache.
- **TEST-005** Wrappers map API ↔ VM including `kind`, `isFavorite`, `expanded`/`day` VM fields.

## Acceptance Criteria

- **AC-001** The user can open a routine day on `/routines/show/:id` with its exercises.
- **AC-002** Creating a routine offline appears immediately and syncs.
- **AC-003** Favorited routines are reflected in plan creation and coach flows.
