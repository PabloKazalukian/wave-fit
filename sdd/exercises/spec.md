# Exercises

## Context

The exercise library is the base catalog of movements used everywhere else (routines, plan days, workouts). The feature is a single low-complexity service (`API + Service`) with offline support and favorites.

## Requirements

### FR: Functionality

- **FR-001** Expose the exercise catalog on `/exercises` in the browser.
- **FR-002** `ExercisesService.getExercises(force?)` loads the catalog; `force` bypasses the cache.
- **FR-003** `createExercise(exercise)` creates a new exercise; offline it generates a local ObjectId, writes to IndexedDB, and enqueues a `CreateExercise` sync operation.
- **FR-004** `setIsFavorite(exerciseId, favorite)` toggles the local favorite flag and syncs to the API (BR-007).
- **FR-005** API responses are wrapped with `wrapperExerciseAPItoVM()` (→ `ExercisePerformanceVM` shape where consumed by tracking).
- **FR-006** Exercises are cached with a `BehaviorSubject` (`exercises` signal) so every consument reads once and reuses.

### BR

- **BR-004** (category normalization) is owned here: the API returns categories in UPPERCASE; normalize with `toLowerCase()`.

### NFR

- **NFR-001** The catalog loads once and is reused across features (change detection via signal).
- **NFR-002** Offline creation must not lose data: optimistic write + queued sync.

## Constraints

- The **current** model has no `muscle`/`equipment` fields (legacy fields removed).
- The page-level create flow is exercised through `exercise-selector`/`exercise-create` widgets (create button is commented on the list page today).
- Service location follows the low-complexity pattern: API and service live together (`exercises.service.ts`).

## Architecture

```
ExercisesService (core/services/exercises/exercises.service.ts)
├── index.js cache (BehaviorSubject → `exercises` signal)
├── GraphQL inline via `core/apollo/exercises.queries.ts`
├── NetworkStatusService + SyncQueueService (offline `CreateExercise` handler)
└── wrapperExerciseAPItoVM (shared/wrappers/exercises.wrapper.ts)
```

Widgets: `shared/components/widgets/exercises/exercise-selector`, `exercise-create`, `table`.

## Data contract

```ts
interface Exercise {
    id?: string;
    name: string;
    description?: string;
    category: ExerciseCategory;
    usesWeight: boolean;
    isFavorite?: boolean;
}

enum ExerciseCategory {
    CHEST,
    BACK,
    LEGS,
    LEGS_FRONT,
    LEGS_POSTERIOR,
    BICEPS,
    TRICEPS,
    SHOULDERS,
    CORE,
    CARDIO,
} // stored lowercase; API sends UPPERCASE
```

## Files

```
src/app/core/services/exercises/exercises.service.ts
src/app/core/services/exercises/exercises.service.spec.ts
src/app/core/apollo/exercises.queries.ts
src/app/shared/wrappers/exercises.wrapper.ts
src/app/shared/interfaces/exercise.interface.ts
src/app/pages/exercises/
src/app/shared/components/widgets/exercises/  (exercise-selector, exercise-create, table)
```

## Tests

- **TEST-001** `getExercises` caches and honors `force`.
- **TEST-002** `createExercise` online calls the API and updates the cache; offline enqueues `CreateExercise`.
- **TEST-003** `setIsFavorite` updates cache optimistically.
- **TEST-004** Category normalization maps UPPERCASE API values to the lowercase enum.

## Acceptance Criteria

- **AC-001** The exercise library renders from cache with fresh data on `force`.
- **AC-002** Creating an exercise offline appears immediately and syncs once back online.
- **AC-003** Favorites persist and reflect in routines/plans/tracking consumers.
