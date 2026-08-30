# INFORME DE SERVICIOS - WaveFit

## RESUMEN EJECUTIVO

| Categoria | Cantidad | Total |
|-----------|----------|-------|
| Trackings | 8 servicios | |
| Workouts | 2 servicios | |
| Routines | 2 servicios | |
| Plans | 4 servicios | |
| Exercises | 1 servicio | |
| Extra-Session | 2 servicios | |
| **TOTAL** | | **19 servicios** |

---

## CLASIFICACION POR SERVICIO

### CATEGORIA: TRACKINGS

| # | Servicio | Tipo | Funciones |
|---|----------|------|----------|
| 1 | `PlanTrackingService` | Facade | createTracking, createWorkout, createWorkoutWithRoutine, findAll, findById, removeExercise, setWorkouts, setExercises, setRestDay, updateExtraSession, removeExtraSession, updateWorkoutStatus, updateWorkoutSession, completeTracking, getWorkouts, getExercises, getWorkout, getExercise, setRemoveAllExercises, removeWorkoutSession, createRoutineFromWorkout |
| 2 | `PlanTrackingDomainService` | Domain | createTracking, createWorkout, createWorkoutWithRoutine, updateExtraSession, removeExtraSession, removeExercise, setRemoveAllExercises, setWorkouts, setExercises, updateWorkoutStatus, updateWorkoutSession, removeWorkoutSession, setRestDay, completeTracking, createRoutineFromWorkout |
| 3 | `PlanTrackingStateService` | State | getTracking, getTrackingValue, setTracking, setLoading, setLoadingTracking, setError, updateTracking, updateWorkout |
| 4 | `TrackingListState` | State | getTrackingById, getStats |
| 5 | `PlanTrackingApi` | API | getTrackingByUser, createTracking, updateTracking, updateTrackingDay, syncTrackingDays, assignRoutineToDay, findAllTrackingByUser, findById, removeExtraSession, removeWorkoutSession, createRoutineByWorkout |
| 6 | `PlanTrackingStorage` | Storage | getTrackingStorage, setTrackingStorage, removeTrackingStorage |
| 7 | `WorkoutApi` | API | updateWorkoutSession |
| 8 | `WorkoutStateService` | State | setDate, updateExercises, loadWorkout |

### CATEGORIA: WORKOUTS

| # | Servicio | Tipo | Funciones |
|---|----------|------|----------|
| 1 | `WorkoutStateService` | State | setDate, updateExercises, loadWorkout |
| 2 | `WorkoutApi` | API | updateWorkoutSession |

### CATEGORIA: ROUTINES

| # | Servicio | Tipo | Funciones |
|---|----------|------|----------|
| 1 | `RoutinesService` | Service | getAllRoutines, updateAllRoutines, getRoutineById, getRoutinesPlans, getRoutinePlanById, getRoutinesByCategory, createRoutine |
| 2 | `RoutinesApiService` | API | getRoutines, getRoutineById, getRoutinesPlans, getRoutinesByCategory, createRoutine |

### CATEGORIA: PLANS

| # | Servicio | Tipo | Funciones |
|---|----------|------|----------|
| 1 | `PlansService` | Service | initPlanForUser, setRoutinePlan, setKindRoutineDay, removeDayRoutine, getRoutinePlan, getRoutinePlanById, createRoutinePlan, currentValue, setDayRoutine, setWeeklyDistribution, setExpandedDay, setDayRoutines, submitPlan, validateTitleUnique, removePlan |
| 2 | `DayPlanStateService` | State | setDay, setKind, clearRoutine |
| 3 | `PlansApiService` | API | getPlans, createPlan, getRoutinePlanById, validateTitleUnique, createInputExercise |
| 4 | `PlansStorageService` | Storage | getPlanStorage, setPlanStorage, removePlanStorage |

### CATEGORIA: EXERCISES

| # | Servicio | Tipo | Funciones |
|---|----------|------|----------|
| 1 | `ExercisesService` | Service | getExercises, createExercise, wrapperExerciseAPItoVM |

### CATEGORIA: EXTRA-SESSION

| # | Servicio | Tipo | Funciones |
|---|----------|------|----------|
| 1 | `ExtraSessionService` | Service | loadCatalog, loadByWorkoutSession, create, update, remove |
| 2 | `ExtraSessionApi` | API | getCatalog, getByWorkoutSession, getByIds, update, remove |

---

## HILOS DE CONEXION (SERVICES CONECTADOS)

### HILO 1: TRACKING PRIMARY FLOW

```
PlanTrackingService (FACADE)
    │
    ▼
PlanTrackingDomainService (DOMAIN)
    │
    ├──► PlanTrackingApi (API)
    ├──► PlanTrackingStorage (Storage)
    ├──► WorkoutApi (API)
    └──► RoutinesService (USES)
```

### HILO 2: SUB-SERVICES DE TRACKING (State/Secondary)

```
PlanTrackingStateService ◀── PlanTrackingDomainService
    │
    ├──► TrackingListState ◀─────── PlanTrackingService
    └──► WorkoutStateService ◀──── PlanTrackingService
```

### HILO 3: PLANS FLOW

```
PlansService
    │
    ├──► DayPlanStateService
    │       │
    │       └──► RoutinesService (conecta para obtener rutinas)
    │
    ├──► PlansApiService (API)
    └──► PlansStorageService (Storage)
```

### HILO 4: ROUTINES FLOW

```
RoutinesService (SERVICE)
    │
    ▼
RoutinesApiService (API)
```

### HILO 5: EXERCISES FLOW

```
ExercisesService (standalone)
    │
    └──► USADO POR:
          ├──► WorkoutApi
          └──► PlanTrackingApi
```

### HILO 6: EXTRA-SESSION FLOW

```
ExtraSessionService
    │
    ├──► ExtraSessionApi (API)
    ├──► PlanTrackingService
    └──► WorkoutStateService
```

---

## MAPA COMPLETO DE CONEXIONES

```
                           AuthService (GLOBAL)
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │             │
        ▼                       ▼                       ▼             ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ RoutinesApiSvc  │   │ PlansApiService │   │PlanTrackingApi │   │WorkoutApi
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │               │               │               │
         ▼               ▼               ▼               ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│RoutinesService  │   │ PlansService    │   │PlanTrackingDomainSvc│
└─────────────────┘   └────────┬────────┘   └────────┬────────┘
                                 │               │               │
                                 ▼               ▼               ▼
                        ┌─────────────────┐   ┌─────────────────┐
                        │DayPlanStateSvc │   │PlanTrackingSvc  │
                        └────────┬───────┘   └────────┬────────┘
                                 │               │
                                 ▼               ▼
                        ┌─────────────────┐   ┌─────────────────┐
                        │RoutinesService │   │TrainingListState│
                        └─────────────────┘   └─────────────────┘
```

---

## SERVICIOS POTENCIALMENTE DESCONECTADOS O CON USO LIMITADO

Analizando el codigo, no existen servicios completamente desconectados. Sin embargo, hay algunos con conexiones minimas:

| Servicio | Conexiones | Estado |
|----------|-----------|--------|
| `PlansStorageService` | Solo → `PlansService` | En uso (localStorage) |
| `PlanTrackingStorage` | Solo → `PlanTrackingDomainService` | En uso (localStorage) |
| `TrackingListState` | Solo → `PlanTrackingService` | En uso (dashboard) |
| `WorkoutApi` | Solo → `PlanTrackingDomainService` | En uso |

---

## CONCLUSION

**No hay servicios desconectados o sin uso.** Todos los 19 servicios estan conectados y formando parte de los flujos definidos:

- **Hilos principales**: 6 flujos de datos definidos
- **Servicios activamente conectados**: 19/19 (100%)
- **Servicios globales** (excluidos del analisis): `DateService`, `AuthService`