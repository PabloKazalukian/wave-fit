# 📅 Mi Semana — MyWeek / Tracking Flow

Documentación técnica de la página `/my-week`, su jerarquía de componentes, servicios y flujo de datos para el seguimiento (tracking) semanal de entrenamientos.

---

## 🎨 Jerarquía de Componentes (actual)

```
MyWeek (Página / Container) — src/app/pages/my-week/my-week.ts
  │
  └─→ TrackingWeekComponent — src/app/shared/components/widgets/tracking/tracking-week/
        │
        ├─→ InfoCard                    (tarjeta "Progresión Semanal")
        ├─→ WeeklyStats                 (estadísticas semanales — carrusel)
        ├─→ ExtraSessionForm            (diálogo de sesiones extra)
        ├─→ TrackingWeekFacade          (diálogos: completar semana, fecha fuera de rango)
        │
        ├─→ NavigatorWeek               (navegación entre días)
        │
        └─→ TrackingWorkoutComponent    (contenedor del workout del día)
              ├─→ WorkoutDayStats       (estadísticas del día — carrusel)
              ├─→ ExtraSessionContent   (sesiones extra del día)
              └─→ [switch por status]
                    ├─ COMPLETE → WorkoutCompleteList
                    ├─ EDITED   → WorkoutEdition (+ ExerciseSelector vía dialog)
                    └─ NOT_STARTED/REST → WorkoutInProgress
                          └─→ WorkoutActionsMenu
                                └─→ WorkoutRoutineSelector
                          └─→ ExerciseSelector (vía dialog)
```

> **Diferencias vs versiones anteriores:** `TrackingActive` **no** se usa en MyWeek (sí en `/home` y `/user`). `WorkoutRoutineSelector` está dentro de `WorkoutActionsMenu` (no directo). Se añadieron `WeeklyStats`, `WorkoutDayStats`, `ExtraSessionForm`, `ExtraSessionContent` y skeletons (`TrackingWeekSkeleton`).

---

## 🏗️ Arquitectura de Servicios

Patrón **Domain + (API | Storage) + State**:

```
PlanTrackingService (Fachada)
│
├── PlanTrackingDomainService (Lógica de negocio + offline/sync)
│     ├── PlanTrackingApi (GraphQL — plan-tranking.api.ts)
│     ├── WorkoutApi (updateWorkoutSession)
│     └── SyncQueueService / NetworkStatusService (offline)
│
├── PlanTrackingStorage (localStorage)
├── PlanTrackingStateService (Estado reactivo + IndexedDB)
└── TrackingListState (historial / success)
```

### PlanTrackingService (Fachada)

Métodos principales usados por la UI:

- `createTracking(planId?)` — crea la semana activa
- `reloadTracking()` — re-consulta forzada
- `createWorkout(dateWorkout)` — marca día como workout completo
- `createWorkoutWithRoutine(routineDayId, date)` — asigna rutina a un día
- `setExercises(date, exercises)` — persiste ejercicios (debounce 4s)
- `setRestDay(day, workout, desiredStatus)` — REST / NOT_STARTED
- `updateExtraSession` / `removeExtraSession`
- `completeTracking(complete)` — finaliza la semana
- `setRemoveAllExercises(date)` — vacía ejercicios
- `removeWorkoutSession(date, id)` — elimina workout del día

> Métodos ya inexistentes: `toggleExercise`, `removeExercise`, `setWorkouts`, `loadWeek`, `completeWorkout`, `getStats`.

### PlanTrackingStateService

- `tracking$` / `tracking` — semana activa
- `loading`, `loadingTracking`, `loadingWorkoutCreation`, `loadingStatusWorkout`, `error`
- `setTracking()` **también persiste a IndexedDB** (no solo storage local)

### WorkoutStateService (`core/services/workouts/workout.state.ts`)

- `selectedDate` (`LocalDate`), `workoutSession`, `exercises`, `outOfDateRange`
- `setDate(date)`, `updateExercises(exercises)`
- Efecto en constructor que auto-selecciona el día (hoy si está en rango, sino el primero) y recarga el workout

---

## 📋 Facades

| Facade                    | Archivo                                                              | Responsabilidad                         |
| ------------------------- | -------------------------------------------------------------------- | --------------------------------------- |
| `TrackingWeekFacade`      | `tracking-week/tracking-week.facade.ts`                              | Coordina la semana, diálogos, completar |
| `TrackingWorkoutFacade`   | `tracking-workout/tracking-workout.facade.ts`                        | Coordina el workout del día             |
| `WorkoutInProgressFacade` | `tracking-workout/workout-in-progress/workout-in-progress.facade.ts` | Sets/reps/peso, persistencia            |

---

## 📊 Modelos de Datos (`shared/interfaces/tracking.interface.ts`)

```typescript
type LocalDate = string; // "yyyy-MM-dd"
type StatusWorkoutSession = 'not_started' | 'complete' | 'rest' | 'edited';
enum StatusWorkoutSessionEnum {
    NOT_STARTED,
    REST,
    COMPLETE,
    EDITED,
}

interface TrackingVM {
    id: string;
    userId: string;
    startDate: LocalDate;
    endDate: LocalDate; // ✅ LocalDate
    workouts?: WorkoutSessionVM[];
    planId?: string | null;
    notes?: string;
    completed: boolean;
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

> Fechas siempre `LocalDate` ("yyyy-MM-dd"); los wrappers de `tracking.wrapper.ts` convierten ISO de Mongo.

---

## 🔄 Flujo de Datos y Eventos

### 1. Inicialización de la Página

1. `MyWeek` inyecta `PlanTrackingService` y reacciona a `tracking()`.
2. Si **no hay** tracking activo → muestra **3 tarjetas** (Coach AI, Explorar planes, Comenzar entrenamiento).
3. Si **hay** tracking → renderiza `TrackingWeekComponent`.
4. Estado de carga → `TrackingWeekSkeleton`.

### 2. Navegación y Selección de Día

1. `NavigatorWeek` cambia la fecha.
2. `WorkoutStateService.setDate(date)` actualiza `selectedDate`.
3. El efecto del constructor recarga `getWorkout(selectedDate)` → `workoutSession`.
4. `TrackingWorkoutComponent` reacciona y renderiza el día.

### 3. Ejecución de Entrenamiento

1. `WorkoutInProgress` maneja sets/reps/peso vía `WorkoutInProgressFacade`.
2. `updateExercises` → `PlanTrackingService.setExercises` (persistencia **con debounce de 4s**).
3. Offline → el Domain encola la op `UpdateWeekLogDay` en `SyncQueueService`.

### 4. Estados del día

- `setRestDay` / `setTrainingDay` → REST / NOT_STARTED.
- `setCompleteStatus` / `setEditedStatus` → COMPLETE / EDITED.
- `setRemoveAllExercises` / `removeWorkoutSession` → limpian el día.

### 5. Finalización

- **Día:** `TrackingWorkoutFacade.startRoutineTracking()` / estados anteriores.
- **Semana:** `TrackingWeekFacade.completeWeek()` abre diálogo de confirmación (completa/incompleta) y de "fecha fuera de rango"; al completar redirige a **`/my-week/success`**.
- La página `Success` usa `TrackingListState` + widget `WeeklyTrackings` (limit 1).

---

## 📁 Archivos Relacionados

```
src/app/core/services/trackings/
├── plan-tracking.service.ts        # Fachada
├── plan-tracking.domain.ts         # Lógica de negocio (offline)
├── plan-tracking.state.ts          # Estado reactivo (+ IndexedDB)
├── tracking-list.state.ts          # Estado lista (success/trackings)
└── plan-tracking/
    ├── api/plan-tranking.api.ts     # GraphQL (nota: "tranking")
    └── storage/plan-tracking.storage.ts # localStorage

src/app/core/services/workouts/
├── workout.state.ts                 # WorkoutStateService
└── api/workout.api.ts               # WorkoutApi

src/app/shared/components/widgets/tracking/
├── tracking-week/ (tracking-week, navigator-week, weekly-stats, tracking-active)
└── tracking-workout/ (tracking-workout, workout-actions-menu, workout-routine-selector,
    workout-in-progress, workout-complete-list, workout-edition, workout-day-stats)

src/app/shared/components/widgets/extra-session/
├── extra-session-form/
└── extra-session-content/
```
