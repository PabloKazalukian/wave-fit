# Plan: Favoritos en ExerciseSelector

## Decisiones confirmadas con el usuario
- **UI:** toggle optimista (se marca al instante, se revierte si falla la mutation).
- **Fuente de verdad:** solo el campo `isFavorite` de la query de exercises (no usar profile state).
- **Extras:** chip/filtro "Favoritos" en el selector.
- El toggle va por la pila **UserProfile** (Domain + API Set + facade), como mutation nueva e independiente de `updateUserTrainingPreference`.

## Cambios

### 1. GraphQL
- `src/app/core/apollo/exercises.queries.ts`
  - Agregar `isFavorite` a `GET_EXERCISES`.
- `src/app/core/apollo/user-profile.queries.ts`
  - Agregar documento:
    ```graphql
    mutation ToggleFavoriteExercise($exerciseId: String!) {
        toggleFavoriteExercise(exerciseId: $exerciseId) {
            _id
            userId
            favoriteExercises
        }
    }
    ```

### 2. Tipos y wrappers
- `src/app/shared/interfaces/exercise.interface.ts`: `Exercise.isFavorite?: boolean`.
- `src/app/shared/interfaces/tracking.interface.ts`: `ExercisePerformanceVM.isFavorite?: boolean`.
- `src/app/shared/utils/profile.types.ts`:
  ```ts
  export interface ToggleFavoriteExerciseAPI {
      _id: string;
      userId: string;
      favoriteExercises: string[];
  }
  ```
- `src/app/shared/wrappers/exercises.wrapper.ts`: mapear `isFavorite: ex.isFavorite ?? false`.

### 3. Capa UserProfile
- `core/services/user/api/user-profile-api.set.service.ts`: `toggleFavoriteExercise(exerciseId): Observable<ToggleFavoriteExerciseAPI | null>` usando la mutation + `handleGraphqlError(this.authSvc)`.
- `core/services/user/api/user-profile-api.service.ts`: delegación al Set service.
- `core/services/user/user-profile.domain.ts`: método `toggleFavoriteExercise(exerciseId)`.
- `core/services/user/user-profile.service.ts` (facade): exponer `toggleFavoriteExercise(exerciseId)`; sin parchear estado de perfil (fuente = isFavorite).

### 4. ExercisesService
- `core/services/exercises/exercises.service.ts`: nuevo método `setIsFavorite(exerciseId: string, isFavorite: boolean)`:
  - Patch optimista sobre la signal `exercises`.
  - Persistir lista actualizada con `this.idb.saveExercises(...)` (consistencia con patrón existente).

### 5. Componente exercise-selector
- `exercise-selector.ts`:
  - Inyectar `UserProfileService`.
  - Signal `pendingFavoriteIds = signal<Set<string>>(new Set())`.
  - Signal `favoritesOnly = signal(false)` + `toggleFavoritesFilter()`.
  - `toggleFavorite(event: Event, ex)`: `stopPropagation()` + `preventDefault()`; patch optimista `exercisesSvc.setIsFavorite(...)`; marcar pending; llamar `userProfileSvc.toggleFavoriteExercise(ex.exerciseId)` con `takeUntilDestroyed`; on error → revertir patch local; finally → quitar de pending.
  - Extender `filteredExercises`: si `favoritesOnly()` → filtrar `ex.isFavorite`.
- `exercise-selector.html`:
  - Botón ★/☆ por fila dentro del `<article>` (type="button", aria-label "Marcar como favorito"/"Quitar de favoritos", deshabilitado si pendiente).
  - Chip "Favoritos" junto a los chips de categoría (mismo estilo/ngClass), filtra por favorito.
  - Mantener HTML semántico (§6.1).

### 6. Verificación
- `npm run lint`
- `npm run build`
- Ajuste mínimo del spec si la nueva inyección lo rompe.

## Notas / fuera de alcance
- Ejercicios cacheados en IndexedDB sin `isFavorite` caen a `false` (campo opcional).
- Sin cola offline para el toggle (el revert cubre el caso offline).
- No se usa `updateUserTrainingPreference` ni se refresca `favoriteExercises` del profile.
