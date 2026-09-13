# 📊 PlanTrackingService

Documentación del servicio de tracking de planes de entrenamiento (semana activa / week-log).

---

## 🏗️ Arquitectura

Es el servicio de **mayor complejidad** de la app. Patrón **Domain + API + Storage + State** (fachada):

```
core/services/trackings/
├── plan-tracking.service.ts       # Fachada (orquesta state + storage + domain)
├── plan-tracking.domain.ts        # Domain Service (lógica de negocio + offline/sync)
├── plan-tracking.state.ts         # State (Signals + BehaviorSubject)
├── tracking-list.state.ts         # Estado de la lista de trackings (historial)
└── plan-tracking/
    ├── api/plan-tranking.api.ts   # GraphQL (⚠️ nota: "tranking" en el nombre)
    └── storage/plan-tracking.storage.ts # Persistencia local (localStorage)
```

> ⚠️ El archivo API se llama `plan-tranking.api.ts` (typo intencional heredado).

### ¿Por qué Domain + API + Storage + State?

- Persistencia remota (API) y local (Storage + IndexedDB).
- Estado reactivo (Signals + `tracking$`).
- Lógica de negocio significativa (Domain) **con soporte offline** (cola de sync).

---

## 🧩 State — `plan-tracking.state.ts`

`PlanTrackingStateService` combina un `BehaviorSubject<TrackingVM>` + `toSignal` y signals auxiliares.

| Signal / getter          | Tipo                                          | Descripción                                    |
| ------------------------ | --------------------------------------------- | ---------------------------------------------- |
| `tracking$`              | `Observable<TrackingVM \| null>`              | Semana activa (BehaviorSubject)                |
| `tracking`               | `Signal<TrackingVM \| null>`                  | toSignal de `tracking$` (`initialValue: null`) |
| `loading`                | `signal<boolean>`                             | Carga genérica                                 |
| `loadingTracking`        | `signal<boolean>`                             | Carga de la semana activa                      |
| `loadingWorkoutCreation` | `signal<{ date: LocalDate; state: boolean }>` | Creación de workout por día                    |
| `loadingStatusWorkout`   | `signal<boolean>`                             | Cambio de estado (REST/EDITED/etc.)            |
| `error`                  | `signal<string \| null>`                      | Último error                                   |
| `userId`                 | `signal<string>`                              | Usuario activo                                 |

**Persistencia:** cada set de tracking **también persiste a IndexedDB** vía `IndexedDbStorageService` (`idb.saveTracking`), no solo al storage local.

Métodos: `setTracking`, `setLoading*`, `setError`, `updateTracking(updater)`, `updateWorkout(date, updater)`, `getTracking()`, `getTrackingValue()`.

---

## 🧠 Domain — `plan-tracking.domain.ts`

`PlanTrackingDomainService` centraliza las mutaciones y la lógica de negocio. Inyecta `PlanTrackingApi`, `WorkoutApi`, `RoutinesService`, `NetworkStatusService`, `SyncQueueService`.

**Registra un handler de sync** en el constructor: `'UpdateWeekLogDay'` → `api.updateTrackingDay`.

| Método                                         | Descripción                                                                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `initTracking()`                               | Consulta la semana activa (`api.getTrackingByUser`)                                                                            |
| `findAllTrackingByUser(limit, offset)`         | Historial paginado                                                                                                             |
| `findById(id)`                                 | Detalle por id                                                                                                                 |
| `createTracking(planId?)`                      | Crea week-log con rango de la semana actual (`LocalDate` + timezone)                                                           |
| `createWorkout(dateWorkout)`                   | Marca el día como workout completo (`updateTrackingDay`, status COMPLETE)                                                      |
| `createWorkoutWithRoutine(routineDayId, date)` | Asigna una rutina del día al workout (`assignRoutineToDay`)                                                                    |
| `updateExercises(date, exercises)`             | Persiste ejercicios; **online** → API, **offline** → encola en `SyncQueue` (`UpdateWeekLogDay`)                                |
| `updateExtraSession(date, extraSession)`       | Añade/actualiza sesión extra del día (payload en el week-log day)                                                              |
| `removeExtraSession(date, extraSessionId)`     | Elimina sesión extra del día                                                                                                   |
| `updateWorkoutSession(date, workout)`          | Delega en `WorkoutApi.updateWorkoutSession`                                                                                    |
| `removeWorkoutSession(date, id)`               | Elimina workout del día (`removeWorkoutSessionFromDay`)                                                                        |
| `setRestDay(date, isRest)`                     | Marca/desmarca día de descanso (`updateDayWorkoutStatus`)                                                                      |
| `completeTracking(complete)`                   | Cierra la semana (`updateTracking` con `completed`, `active:false`), rellena los 7 días con `emptyDay`, limpia state y storage |
| `createRoutineFromWorkout(title, exerciseIds)` | Crea una rutina a partir del workout y refresca `RoutinesService`                                                              |
| `removeTracking(id)`                           | Elimina week-log; limpia state/storage si coincide                                                                             |

> **Fecha:** todos los `LocalDate` son `"yyyy-MM-dd"` (nunca `Date`).

---

## 🏛️ Fachada — `plan-tracking.service.ts`

`PlanTrackingService` coordina Domain + State + Storage y expone la API pública de la UI.

**Señales expuestas:** `tracking`, `loading`, `loadingTracking`, `loadingWorkoutCreation`, `loadingStatusWorkout`, `trackingPlanVM$` (alias de `tracking$`), `user$`.

**En el constructor:**

- `effect` reactivo al usuario → `initTracking(user)` (o limpia si deslogueado).
- `exercisesUpdate$` con **`debounceTime(4000)`** → `domain.updateExercises(...)`, para persistir ejercicios sin saturar la API.

**Métodos:**

| Método                                                     | Descripción                                         |
| ---------------------------------------------------------- | --------------------------------------------------- |
| `createTracking(planId?)`                                  | Crea semana activa                                  |
| `reloadTracking()`                                         | Re-consulta la semana ignorando caché (forzado)     |
| `createWorkout(dateWorkout)`                               | Marca workout completo + actualiza state/storage    |
| `createWorkoutWithRoutine(routineDayId, date)`             | Asigna rutina y obtiene el workout resultante       |
| `findAll(limit, offset)` / `findById(id)`                  | Historial y detalle                                 |
| `setExercises(date, exercises)`                            | Actualiza cache y encola persistencia (debounce 4s) |
| `setRestDay(day, workout, desiredStatus)`                  | REST / NOT_STARTED                                  |
| `updateExtraSession(date, form)`                           | Actualiza `extras` del workout del día              |
| `removeExtraSession(date, extraSessionId)`                 | Remueve sesión extra                                |
| `updateWorkoutStatus(date, status)`                        | Actualiza cache local del status                    |
| `updateWorkoutSession(date, workout)`                      | Persiste vía API y refresca cache                   |
| `completeTracking(complete)`                               | Finaliza la semana                                  |
| `getWorkouts`, `getExercises`, `getWorkout`, `getExercise` | Selectores reactivos sobre `tracking$`              |
| `setRemoveAllExercises(date)`                              | Vacía ejercicios del día + encola                   |
| `removeWorkoutSession(date, id)`                           | Elimina workout del día                             |
| `createRoutineFromWorkout(title, exerciseIds)`             | Crea rutina desde el workout                        |
| `removeTracking(id)`                                       | Elimina week-log                                    |

> Métodos **eliminados** (ya no existen): `loadWeek`, `setActivePlan`, `completeWorkout`, `getStats` (movido a `TrackingListState`), `toggleExercise`, `removeExercise`, `setWorkouts`.

---

## 🌐 API — `plan-tranking.api.ts`

`PlanTrackingApi` (GraphQL). Todos los query/mutation vienen de `core/apollo/tracking.queries.ts`.

| Método                                       | Query/Mutation                    | Notas                           |
| -------------------------------------------- | --------------------------------- | ------------------------------- |
| `getTrackingByUser()`                        | `FIND_ACTIVE_WEEK_LOG`            | `no-cache`; wrap a `TrackingVM` |
| `createTracking(payload)`                    | `CREATE_WEEK_LOG`                 |                                 |
| `updateTracking(payload)`                    | `UPDATE_WEEK_LOG`                 | wrap a `TrackingVMS`            |
| `updateTrackingDay(payload)`                 | `UPDATE_WEEK_LOG_DAY`             | wrap a `WeekLogDayVM`           |
| `assignRoutineToDay(routineDayId, date)`     | `ASSIGN_ROUTINE_TO_DAY`           |                                 |
| `findAllTrackingByUser(limit, offset)`       | `FIND_ALL_TRACKING_BY_USER`       | `no-cache`                      |
| `findById(id)`                               | `FIND_BY_ID`                      |                                 |
| `removeExtraSession(date, id)`               | `REMOVE_EXTRA_SESSION_FROM_DAY`   |                                 |
| `removeWorkoutSession(date, id)`             | `REMOVE_WORKOUT_SESSION_FROM_DAY` |                                 |
| `createRoutineByWorkout(title, exerciseIds)` | `CREATE_ROUTINE_BY_WORKOUT`       |                                 |
| `updateDayWorkoutStatus(date, isRest)`       | `UPDATE_DAY_WORKOUT_STATUS`       | `no-cache`                      |
| `removeTracking(id)`                         | `REMOVE_WEEK_LOG`                 |                                 |

Depende de `ExercisesService.getExercises()` (resuelve nombres/categorías de ejercicios antes de mapear).

---

## 💾 Storage — `plan-tracking.storage.ts`

`PlanTrackingStorage` (localStorage):

- `getTrackingStorage(userId)` / `setTrackingStorage(tracking, userId)` / `removeTrackingStorage(userId)`.

> ⚠️ La lectura del storage al inicio está **comentada** en la fachada (`plan-tracking.service.ts:74`). La persistencia **activa** hoy es **IndexedDB** vía `PlanTrackingStateService`.

---

## ⏱️ Offline / Sync

- `updateExercises` en el Domain detecta `NetworkStatusService.isOnline()`: si está offline genera un id local y encola una op `'UpdateWeekLogDay'` en `SyncQueueService`; al reconectar el handler registrado reenvía a `api.updateTrackingDay`.

---

## 📇 Interfaces (`shared/interfaces/tracking.interface.ts`)

```typescript
type LocalDate = string; // "yyyy-MM-dd"
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
    endDate: LocalDate; // ✅ LocalDate, no Date
    workouts?: WorkoutSessionVM[]; // rama de workouts
    planId?: string | null;
    notes?: string;
    completed: boolean;
}

interface TrackingVMS {
    // variante con `days` (WeekLog)
    id: string;
    userId: string;
    startDate: LocalDate;
    endDate: LocalDate;
    planId?: string | null;
    days: WeekLogDayVM[];
    completed: boolean;
    notes?: string;
    workouts?: WorkoutSessionVM[];
    extras?: string[];
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

Tipos `DayStatusVM = 'pending' | 'complete' | 'skipped'`, `WeekLogDayVM { order, date, isRest, workoutSessionId?, exercises, extraSessionIds, status }`.

---

## Notas

- Único servicio con patrón Domain + API + Storage + State.
- Fechas siempre `LocalDate`; los wrappers de `shared/wrappers/tracking.wrapper.ts` convierten ISO de Mongo → LocalDate con la TZ del usuario.
- `TrackingListState` (en `tracking-list.state.ts`) gestiona el historial y `getStats()`.
