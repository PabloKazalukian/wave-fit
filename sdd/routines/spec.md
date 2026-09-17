# Routines

## Context

A **RoutineDay** is a daily workout template (TEMPLATE branch): a title, optional muscle-category filter, a list of exercises, a `kind` (WORKOUT/REST), and an optional favorite flag. The routines feature manages these day templates and is consumed by plans, tracking, and the `/routines/show/:id` page.

## Requirements

### FR: Functionality

- **FR-001** `/routines/show/:id` displays a **weekly plan** (7-day timeline with routine days) plus a "start tracking" button — not a single routine day as originally spec'd. The `Show` component injects `PlansService` + `PlanTrackingService` (not `RoutinesService`), loads a `routinePlan` via `getRoutinePlanById`, and renders the full week.
- **FR-002** `RoutinesService.getAllRoutines()` loads/caches all routine days (cache `routinesCache$` `BehaviorSubject`).
- **FR-003** `updateAllRoutines()` refreshes the cache wholesale. **Note:** includes an artificial `delay(500)` not in the original spec.
- **FR-004** `getRoutineById(id)` resolves routines (inline `gql`). **Note:** `getRoutinePlanById(id)` and `getRoutinesPlans()` in `RoutinesService` are dead code — they are never called by any consumer. Plan loading goes through `PlansService.getRoutinePlanById` → `PlansApiService`. Additionally, `getRoutineById` returns inconsistent shapes: cache path returns wrapped `RoutineDay`, network path returns raw Apollo payload with `{ order, exercise }[]`.
- **FR-005** `getRoutinesByCategory(category)` filters routines by exercise category.
- **FR-006** `createRoutine(data)` creates a routine day; offline it generates a local ObjectId, writes locally (in-memory cache only — not persisted to IndexedDB on offline path), and enqueues a `CreateRoutineDay` sync operation.
- **FR-007** `setIsFavorite(routineId, favorite)` toggles the favorite flag in the in-memory cache and IndexedDB. **Note:** does NOT sync to the API. Synchronization is handled ad-hoc by callers (e.g., `workout-routine-selector.ts` and `plans.ts`), which duplicate optimistic-toggle + rollback logic independently.
- **FR-008** Wrappers map API ↔ VM: `wrapperRoutineDayAPItoRoutineDay`, `wrapperRoutineDayCreateToPayload`. **Note:** `wrapperRoutineDayAPItoRoutineDayVM` (used by `PlansApiService`) hardcodes `day: 1` and `expanded: false` for every routine day.

### BR

- **BR-004** (category normalization): ~~applies~~ **NOT implemented** in wrappers — no `toLowerCase()` anywhere in `routines.wrapper.ts`.
- **BR-007** (favorites): applies but with caveats (see FR-007).

### NFR

- **NFR-001** Frequent accesses reuse the cached catalog (no repeated fetches).
- **NFR-002** Offline create keeps the routine usable immediately and syncs later. **Note:** the actual widget flow (`routine-exercise-form.facade.ts`) calls `updateAllRoutines()` after create, which performs a `network-only` fetch — so offline creation UI is broken because the post-create refresh fails.

## Constraints

- Routines belong to the **TEMPLATE** branch; they never represent executed sessions.
- Kind is `REST | WORKOUT` (`KindType`). **Note:** the API→VM wrapper hardcodes `kind` to `WORKOUT` for every routine day, even when `RoutineDayAPI.kind` exists.
- The `plan-id`/`routineDayId` linkage used by tracking (assign routine to day) is defined in the Tracking/Day-log specs.

## Architecture

```
RoutinesService (core/services/routines/routines.service.ts)     — cache + orchestration
└── RoutinesApiService (core/services/routines/api/routines.api.ts) — GraphQL
    └── inline gql (routines.queries) + SyncQueueService (offline CreateRoutineDay)
```

Widgets:
- `shared/components/widgets/plans/routine-form` (selector `app-routine-plan-form` — lives under `widgets/plans/`, not `widgets/routines/`)
- `shared/components/widgets/routines/routine-list-box` (and `routine-exercises/`)
- `shared/components/widgets/routines/routine-exercise-form`
- `shared/components/widgets/plans/weekly-routine-planner` (and `day-of-routine/`, `routine-days-progress/`)
- `shared/components/widgets/tracking/tracking-workout/workout-routine-selector`
- `shared/components/widgets/users/routines-used` (dead widget — not referenced by any other file)

**Known widget issues:**
- `DaysRoutineProgress` has a trailing dot in its selector (`'app-days-routine-progress.'`) — it cannot match the `<app-days-routine-progress>` element; the component likely never renders.
- `RoutineListBoxFacade`/`RoutineExerciseFormFacade` use `state.routinaDay()` (typo for "routineDay").

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
    day: DayIndex; // 1..7 (hardcoded to 1 by wrapperRoutineDayAPItoRoutineDayVM)
    exercises?: Exercise[];
}

interface RoutineDayCreateSend {
    title: string;
    type?: ExerciseCategory[] | string[];
    exercises?: ExerciseSend[]; // { exercise, order }
    planId?: string;
}
```

**Note:** `RoutineDayAPI` declares `category: ExerciseCategory[]` but every gql query requests `type` (not `category`). `pages/plans/plans.ts` reads `day.category` from a query that only returns `routineDays { id }`, so category filters are always empty.

## Extra features (not in original spec)

- **Create routine from workout:** `createRoutineByWorkout` in `PlanDayDomainService` and `PlanTrackingDomainService` — creates a routine day from a completed workout's exercises.
- **Favorites in tracking:** `WorkoutRoutineSelector` has a favorites filter (star button, "★ Favoritos" filter) with optimistic toggle and pending state.
- **Favorites in plans:** `/plans` page has favorites filter + toggle for plans.
- **Tracking kickoff from show page:** "Iniciar rutina semanal" button on `/routines/show/:id` starts a week tracking session, with a "week already active" dialog.
- **`wrapperRoutineDayToExerciseIds`:** bridges routine days to plan API exercise IDs.

## Dead code

- **All 5 exported gql constants in `routines.queries.ts`** are unused — services duplicate inline gql. The constants are also stale: `GET_ROUTINE_DAYS` lacks `isFavorite`/`kind`; `GET_ROUTINE_PLANS` only fetches `id`; `GET_ROUTINE_DAY` lacks `isFavorite`.
- **3 of 5 `RoutinesApiService` methods** are dead code: `getRoutinesPlans`, `getRoutinesByCategory`, `createRoutine`. Only `getRoutines` and `getRoutineById` are consumed.
- **`RoutinesService.getRoutinePlanById`** is dead code — its inline gql omits `routineDays` and no consumer calls it.
- **Public wrapper delegate** `wrapperRoutineDayAPItoRoutineDay` on the ApiService is unused.
- **`RoutineEvent` type** in `sync.types.ts` is unused; payload shapes are `any`.
- **`routinePlanValidator()`** in `routine-plan.validator.ts` is unused.
- **`routineDaysValidator`** exists as an exact duplicate in `unique-title.validator.ts` (unused) alongside the used one in `routine-days.validator.ts`.
- **`wrappedRoutineDayToSend`** remains as commented-out dead code in `routines.service.ts`.

## Known issues

- **Offline create UI is broken (violates AC-002/NFR-002):** After offline `createRoutine` succeeds, `submitRoutine` chains `updateAllRoutines()`, which performs a `network-only` fetch that fails offline. The error branch only resets `loadingCreate`; `onSuccess()` is never called.
- **`getRoutineById` returns inconsistent shapes:** cache path returns wrapped `RoutineDay` (exercises flattened to `Exercise[]`), network path returns raw `{ order, exercise }[]`.
- **`getRoutinesPlans()`** executes `this.authSvc.user$.subscribe()` as a fire-and-forget call (copy-paste smell).
- **No default child route** for bare `/routines` — `routine-form.ts` `confirmCancel()` navigates to `/routines`, which matches no child, falling through to `**` → home.
- **Bug in show.ts:** guard `if (this.userId() !== '' || this.userId() !== undefined || this.userId() !== null)` is always true (logic error).
- **Dead `openIndex` signal** in `show.ts` — never used in template.

## Files

```
src/app/core/services/routines/routines.service.ts  (+ spec — broken, imports './routines')
src/app/core/services/routines/api/routines.api.ts  (+ spec — trivial smoke test)
src/app/core/apollo/routines.queries.ts
src/app/shared/wrappers/routines.wrapper.ts
src/app/shared/interfaces/routines.interface.ts
src/app/shared/interfaces/api/routines-api.interface.ts
src/app/shared/validators/routine-days.validator.ts
src/app/shared/validators/routine-plan.validator.ts  (unused)
src/app/shared/validators/unique-title.validator.ts  (duplicate routineDaysValidator)
src/app/pages/routines/routines.routes.ts
src/app/pages/routines/show/  (show.ts, show.html)
src/app/shared/components/widgets/plans/routine-form/  (+ spec)
src/app/shared/components/widgets/routines/routine-list-box/  (+ spec)
src/app/shared/components/widgets/routines/routine-exercise-form/  (+ spec)
src/app/shared/components/widgets/plans/weekly-routine-planner/  (+ spec)
src/app/shared/components/widgets/plans/weekly-routine-planner/day-of-routine/  (+ spec)
src/app/shared/components/widgets/plans/weekly-routine-planner/routine-days-progress/  (+ spec)
src/app/shared/components/widgets/tracking/tracking-workout/workout-routine-selector/
src/app/shared/components/widgets/users/routines-used/  (dead widget)
```

## Tests

- **TEST-001** `getAllRoutines` caches; `updateAllRoutines` refreshes. ✅ (`routines.service.spec.ts`)
- **TEST-002** `getRoutinesByCategory` filters correctly. ✅ (`routines.service.spec.ts`)
- **TEST-003** `createRoutine` offline enqueues `CreateRoutineDay`. ✅ (`routines.service.spec.ts`)
- **TEST-004** `setIsFavorite` optimistically updates the cache. ✅ (`routines.service.spec.ts`)
- **TEST-005** Wrappers map API ↔ VM including `kind`, `isFavorite`, `expanded`/`day` VM fields. ✅ (`routines.wrapper.spec.ts`)

**Note:** The broken `routines.spec.ts` was removed; `routines-api.service.spec.ts` and `routine-form.spec.ts` are green.

## Acceptance Criteria

- **AC-001** The user can open a routine plan on `/routines/show/:id` with its 7-day timeline and exercises. ✅
- **AC-002** ~~Creating a routine offline appears immediately and syncs.~~ ❌ Offline create UI is broken (post-create refresh requires network).
- **AC-003** Favorited routines are reflected in plan creation and coach flows. ⚠️ Favorites exist in tracking selector and plans page, but NOT in `RoutineListBox`/`routine-list-box` widget (plan creation and coach flows).
