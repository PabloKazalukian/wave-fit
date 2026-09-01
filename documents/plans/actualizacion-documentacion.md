# 🗂️ Plan de Actualización de Documentación — WaveFit

> Documento de trabajo. Va por fuera de git (`documents/plans/` está en `.gitignore`).
> Estado: **pendiente de ejecución**.

---

## Contexto

Tras revisar el código actual del frontend, la documentación existente (`documents/`, `AGENTS.md`, `CONTRACT.md`) tiene **desfases importantes** con la realidad. Este documento recoge el plan para actualizarla.

También hay un cambio de configuración: **sacar `AGENTS.md` del `.gitignore`** para versionarlo en el proyecto (junto con `CONTRACT.md` y `documents/workflows`).

---

## Parte A — Gitignore (versionar AGENTS.md y docs)

- Quitar de `.gitignore` las líneas:
  - `AGENTS.md`
  - `CONTRACT.md`
  - `documents/workflows` y `documents/workflows/*`
- Añadir esos archivos con `git add` (AGENTS.md, CONTRACT.md, documents/workflows).

> ⚠️ `documents/plans/` se mantiene fuera de git (ver más abajo).

---

## Parte B — Servicios (`documents/services/`)

1. **Eliminar `UserService.md`** — documenta un servicio que ya no existe (reemplazado por `UserProfileService`). Actualizar `index.md` y `AGENTS.md` que lo referencian.
2. **Reescribir `PlanTrackingService.md`**:
   - Signals reales (`tracking`, `loading`, `loadingTracking`, `loadingWorkoutCreation`, `loadingStatusWorkout`, `error`).
   - 17 métodos nuevos: `createTracking`, `createWorkout`, `createWorkoutWithRoutine`, `findAll`, `findById`, `setRestDay`, `updateExtraSession`, `removeExtraSession`, `updateWorkoutStatus`, `updateWorkoutSession`, `getWorkouts`, `getExercises`, `getExercise`, `setRemoveAllExercises`, `removeWorkoutSession`, `createRoutineFromWorkout`, `removeTracking`, `completeTracking(complete)`.
   - Eliminados: `loadWeek`, `setActivePlan`, `completeWorkout`, `getStats`, `toggleExercise`, `removeExercise`, `setWorkouts`.
   - Domain real (sin `getOrCreateTracking`/`syncTracking`/`calculateStats`) con **offline/sync** (`SyncQueueService`).
   - API renombrada `plan-tranking.api.ts` (`getTrackingByUser`, `createTracking`, `updateTracking`, `updateTrackingDay`, `assignRoutineToDay`, etc.).
   - Storage local → **IndexedDB** (vía `IndexedDbStorageService`); lectura inicial comentada.
   - Interfaces `*VM` con `LocalDate` (`TrackingVM.notes`, `WorkoutSessionVM.extras/notes/planId`, `ExercisePerformanceVM.usesWeight/isFavorite`, `StatusWorkoutSessionEnum` con `NOT_STARTED|COMPLETE|REST|EDITED`).
3. **Reescribir `ExtraSessionService.md`**:
   - **No hay Storage** (la doc decía "API + Storage", falso).
   - Métodos:`loadCatalog`, `loadByWorkoutSession(ids)`, `create`, `update`, `remove` (delegan en `PlanTrackingService`).
   - Modelo `category/discipline/intensityLevel/calories/met` (catálogo de disciplinas).
   - API sin `createExtraSession` (mutation comentada); `getCatalog`, `getByWorkoutSession`, `getByIds`, `update`, `remove`.
4. **Actualizar `AuthenticationAndApollo.md`**:
   - `TokenStorage` ahora **async sobre IndexedDB (Dexie)** en `core/auth/token.storage.ts` (antes localStorage síncrono).
   - Nuevos métodos `AuthService`: `initializeUserFromStorage`, `updateAvatar`, `avatarUrl`.
   - Timeouts reales: `me()` 2000ms, auth.initializer 3000ms.
   - Credentials guardadas desde `login.ts` (no en `AuthService.login()`).
5. **Actualizar `WorkoutStateService.md`**:
   - Archivo real `workout.state.ts` + `api/workout.api.ts` (`WorkoutApi.updateWorkoutSession`).
   - `selectedDate` ahora `LocalDate`; efecto constructor con `DateService`.
6. **Actualizar `UserProfileService.md`**:
   - Métodos nuevos: `completeBasicSetup`, `updateTrainingPreference`, `toggleFavoriteExercise/Routine/RoutineDay`, `resetMyProfile`.
   - Señal `savingSetup`; renombrar `updateHealth` → `updateHealthConstraints`.
7. **Actualizar `ExercisesService.md` y `RoutinesService.md`**:
   - Campos de queries reales (`usesWeight`, `isFavorite`, `exercises { order exercise { id name category } }`).
   - `setIsFavorite` en ambos; parámetro `force` en `getExercises`.
   - Soporte offline/IndexedDB/SyncQueue (`CreateExercise`, `CreateRoutineDay`).
   - Delay real 500ms (la doc decía 2000).
8. **Actualizar `index.md`** (árbol + tablas + diagrama):
   - Añadir `coach/`, `network/`, `sync/`, `storage/`, `training-history/`; corregir `user/` → UserProfile.
   - Tablas: `ExtraSession` sin Storage, `DayPlan` solo State, `User` inexistente, `UserProfile` con Domain, añadir `TrainingHistory`.

---

## Parte C — Componentes (`documents/components/`)

9. **Reescribir `MyWeekComponent.md`**:
   - Jerarquía real: `TrackingWeek → WeeklyStats, NavigatorWeek, ExtraSessionForm, TrackingWorkout → WorkoutDayStats + (WorkoutCompleteList | WorkoutEdition | WorkoutInProgress → WorkoutActionsMenu → WorkoutRoutineSelector) + ExtraSessionContent`.
   - Flujos nuevos: página `/my-week/success`, `createWorkoutWithRoutine`, estados REST/EDITED (`setRestDay`, `setCompleteStatus`, `setEditedStatus`), confirmación `completeWeek()` con diálogos, debounce 4s de persistencia, offline/sync.
   - Storage/state (IndexedDB en `PlanTrackingState`).
10. **Reescribir `RoutinePlanComponent.md`**:
    - Capa **Facades** nueva: `RoutinePlanFormFacade`, `RoutineListBoxFacade`, `RoutineExerciseFormFacade`, `ExerciseCreateFacade`, `ExercisesTableFacade`.
    - Offline/sync/IndexedDB en `PlansService` (submit online/offline, handlers `CreateRoutinePlan`, `CreateRoutineDay`).
    - Rutas reales: `/plans/create` → `/routines/show/:id` (NO `/routines/create`).
    - Feature **favoritos** (routine-days, rutinas y ejercicios).
    - Nombre correcto `DaysRoutineProgress` (sin sufijo Component).
    - Componentes UI: `SuccessScreen`, `Dialog`, `AccordionItem`, etc.
11. **Actualizar `index.md` de componentes**: nuevas jerarquías, facades y widgets.
12. **Nuevo `TrainingHistoryComponent.md`** (página `/user/history` — calendario mensual; consume `TrainingHistoryService`).
13. **CoachComponent.md**: ya está al día; solo retoques menores si hace falta.

---

## Parte D — Cross-cutting

14. **AGENTS.md**:
    - §8 (Estructura de Servicios): reflejar `coach/`, `network/`, `sync/`, `storage/`, `training-history/`, `workouts/`, y `user/` = UserProfile (no UserService).
    - §10 (Rutas): añadir `/user/history`; aclarar `/plans/create` → `/routines/show/:id`.
15. **CONTRACT.md**: corregir/ampliar interfaces y wrappers (`LocalDate`, `notes`, `extras`, `usesWeight`, `isFavorite`, `isAiGenerated`, campos de queries).

---

## Notas / observaciones

- **`documents/pwa/*`**: existen en disco pero nunca se commitean y no están ignorados. Decidir si versionarlos o ignorarlos.
- **Código muerto detectado** (se puede limpiar más adelante, fuera de alcance de esta documentación):
  - `apollo/coach.query.ts`: `CREATE_TRAINING_PLAN` comentado.
  - `apollo/tracking.queries.ts`: `SYNC_WEEK_LOG_DAYS`, `ASSIGN_ROUTINE_TO_DAYS` duplicada, `CREATE_WORKOUT_SESSION`, `UPDATE_WEEK_LOG_WORKOUT_SESSION`, `REMOVE_WORKOUT_SESSION_FROM_DAY` comentado.
  - `workout.wrapper.ts` vacío.
  - Widgets `users/routines-used` y `users/exercises-used`: huérfanos (sin consumidor).
