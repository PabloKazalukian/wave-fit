# Exercises

## Context

The exercise library is the base catalog of movements used everywhere else (routines, plan days, workouts). The feature is a single low-complexity service (`API + Service`) with offline support and favorites.

## Requirements

### FR: Functionality

- **FR-001** Expose the exercise catalog on `/exercises` in the browser.
- **FR-002** `ExercisesService.getExercises(force?)` loads the catalog; `force` bypasses the cache.
- **FR-003** `createExercise(exercise)` creates a new exercise; offline it generates a local ObjectId, writes to IndexedDB, and enqueues a `CreateExercise` sync operation.
- **FR-004** `setIsFavorite(exerciseId, favorite)` updates the local cache (signal + IndexedDB) optimistically; the API sync is performed by the `exercise-selector` widget through `UserProfileService.toggleFavoriteExercise` (BR-007), not by the service itself.
- **FR-005** Exercises are wrapped with `wrapperExerciseAPItoVM()` where consumed (e.g. the `exercise-selector` computed; also exposed as `ExercisesService.wrapperExerciseAPItoVM()`), producing the `ExercisePerformanceVM` shape used by tracking.
- **FR-006** Exercises are cached in the reactive signal `exercises` (Angular `signal`, not a `BehaviorSubject`) + IndexedDB so every consumer reads once and reuses.

### BR

- **BR-004** (category normalization) is owned here. Current code stores `ExerciseCategory` as **lowercase** string values and passes them through without runtime normalization; the `exercise-category` pipe lowercases only for display labels, and the exercises table facade keeps UPPERCASE lookup keys.

### NFR

- **NFR-001** The catalog loads once and is reused across features (change detection via signal).
- **NFR-002** Offline creation must not lose data: optimistic write + queued sync.

## Constraints

- The **current** model has no `muscle`/`equipment` fields (legacy fields removed).
- The page-level create flow is exercised through the `exercise-selector`/`exercise-create` widgets; the `/exercises/create` route is commented out in `exercises.routes.ts` and the list page hosts only a category select.
- Service location follows the low-complexity pattern: API and service live together (`exercises.service.ts`).

## Architecture

```
ExercisesService (core/services/exercises/exercises.service.ts)
├── `exercises` signal (Angular signal) + IndexedDB table `exercises` cache
├── GraphQL via `core/apollo/exercises.queries.ts`
├── NetworkStatusService + SyncQueueService (offline `CreateExercise` handler, registered in the service)
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
    CHEST = 'chest',
    BACK = 'back',
    LEGS = 'legs',
    LEGS_FRONT = 'legs_front',
    LEGS_POSTERIOR = 'legs_posterior',
    BICEPS = 'biceps',
    TRICEPS = 'triceps',
    SHOULDERS = 'shoulders',
    CORE = 'core',
    CARDIO = 'cardio',
} // lowercase string values; no runtime normalization (see BR-004)
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
