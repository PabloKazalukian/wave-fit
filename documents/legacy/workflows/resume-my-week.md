# MyWeek — Flujo de Arranque y Tracking

## Resumen Ejecutivo

El componente `MyWeek` consume `PlanTrackingService` (fachada) para obtener y trabajar con el tracking semanal y sus workouts. El flujo sigue la arquitectura **Domain + (API | Storage) + State**.

---

## 1. Routing (Lazy Load)

```
app.routes.ts:31 → 'my-week' → loadChildren() → my-week.routes.ts → loadComponent() → MyWeek
```

---

## 2. Flujo Completo de Inicialización

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. MyWeek.ngOnInit() (my-week.ts:27)                                          │
│    → Suscribe a PlanTrackingService.trackingPlanVM$                          │
│    → Pasa el tracking al signal local: this.tracking                          │
└────────────────────────────────────────────────────────────────────────────┬──────────────────┘
                                                             │
                                                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. PlanTrackingService (constructor) (plan-tracking.service.ts:46)       │
│    → effect() que escucha authService.user$                              │
│    → Cuando user existe → initTracking(user)                          │
└────────────────────────────────────────────────────────────────┬──────────┘
                                                                     │
                                                          ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ 3. PlanTrackingService.initTracking() (plan-tracking.service.ts:57)    │
│    → Verifica si ya tiene tracking en cache (mismo userId)              │
│    ├── SI → Setea tracking desde storage y sale (no re-carga)             │
│    └── NO → Llama domain.initTracking() + subscribe               │
└────────────────────────────────────────────────────────────┬─┘
                                                                 │
                                                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4. PlanTrackingStateService (plan-tracking.state.ts:10)                        │
│    → BehaviorSubject<TrackingVM | null>                               │
│    → tracking$ = asObservable()                                    │
│    → tracking = toSignal(tracking$, { initialValue: null })       │
│    → Signals de loading: loadingTracking, loadingWorkoutCreation   │
└───────────────────────────────────────────────────────────────┬────────┘
                                                                  │
                                                           ▼
┌───────────────────────────────────────────────────────────────────────┐
│ 5. PlanTrackingDomainService.initTracking() (plan-tracking.domain.ts:62)         │
│    → api.getTrackingByUser()                                        │
│    → Retorna Observable<TrackingVM | null>                           │
└──────────────────────────────────────────────────────────────┬──────────────┘
                                                                 │
                                                                 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ 6. PlanTrackingApi.getTrackingByUser() (plan-tranking.api.ts:48)             │
│    → exerciseSvc.getExercises() → switchMap →                     │
│    → apollo.query(FIND_ACTIVE_WEEK_LOG)                            │
│    → wrapperTrackingApiToVM(data, exercises)                      │
│    → Retorna TrackingVM                                           │
└────────────────────────────────────────────────────────────────┬┘
                                                                 │
                                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 7. Vuelta: API → Domain → Service → State                                 │
│    → Domain.setTracking(trackingVM) (plan-tracking.domain.ts:88)        │
│    → Service._persist(tracking) (plan-tracking.service.ts:98)       │
│    → Service._persist: state.setTracking() + storage.setTracking() │
│    → State.setTracking(): trackingSubject.next(tracking)            │
└──────────────────────────────────────────────────────────┬─────────┘
                                                             │
                                                             ▼
┌──────────────────────────────────────────────────────────────┐
│ 8. Storage (localStorage) (plan-tracking.storage.ts)                │
│    → Key: 'tracking:' + userId                               │
│    → JSON.stringify → localStorage.setItem()                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Capa de State (PlanTrackingStateService)

| Propiedad                | Tipo                                  | Descripción                      |
| ------------------------ | ------------------------------------- | -------------------------------- |
| `trackingSubject`        | `BehaviorSubject<TrackingVM \| null>` | Fuente de verdad reactiva        |
| `tracking$`              | `Observable` (readonly)               | Observable del subject           |
| `tracking`               | `Signal<TrackingVM \| null>`          | Signal derivado (via `toSignal`) |
| `userId`                 | `Signal<string>`                      | ID del usuario activo            |
| `loadingTracking`        | `Signal<boolean>`                     | Loading del tracking             |
| `loadingWorkoutCreation` | `Signal<{date, state}>`               | Loading por fecha                |
| `loadingStatusWorkout`   | `Signal<boolean>`                     | Loading de status workout        |
| `error`                  | `Signal<string \| null>`              | Errores                          |

### Métodos clave

| Método                         | Ubicación | Función                                               |
| ------------------------------ | --------- | ----------------------------------------------------- |
| `getTrackingValue()`           | state:33  | Retorna `trackingSubject.value` (sync)                |
| `setTracking(t)`               | state:37  | `trackingSubject.next(t)`                             |
| `updateWorkout(date, updater)` | state:67  | Mapea workouts y actualiza el que coincide con `date` |

---

## 4. Cache Strategy

```
┌─────────────────────────────────────────────┐
│ 1. In-memory: trackingSubject (BehaviorSubject)  │
│    → Siempre disponible, reactivo            │
│    → Se persiste a localStorage            │
├─────────────────────────────────────────────┤
│ 2. Storage: localStorage                  │
│    → Key: 'tracking:' + userId            │
│    → TTL: Hasta que expira o se limpia     │
│    → Estrategia: Cache-first              │
│       → MyWeek se suscribe → obtiene      │
│         storage inmediato → no re-render    │
│       → API se consulta en background       │
│       → Si API es nuevo → actualiza storage  │
├─────────────────────────────────────────────┤
│ 3. API call: solo si no hay storage      │
│    → o si userId cambió                 │
│    → FetchPolicy: 'no-cache'            │
└─────────────────────────────────────────────┘
```

---

## 5. Trabajar con Workouts

### 5.1 WorkoutStateService — Selección de Día Activo

```
┌────────────────────────────────────────────────────────────────────────┐
│ WorkoutStateService (workout.state.ts)                              │
│                                                                 │
│ selectedDate = signal<LocalDate | null>  ← Día seleccionado        │
│ workoutSession = signal<WorkoutSessionVM | null>  ← Workout actual │
│                                                                 │
│ constructor effect:                                              │
│   1. tracking cambia → recalcula selectedDate                  │
│   2. Si no hay selectedDate → busca hoy (todayLocalDate)        │
│      → Si hoy está en [startDate, endDate] → lo setea          │
│      → Sino → usa el primer día del tracking                    │
│   3. Llama trackingSvc.getWorkout(selectedDate)            │
│      → Subscribe → workoutSession.set(workout)                │
│                                                                 │
│ Método setDate(date):                                         │
│   → loadWorkout(date)                                        │
│       → selectedDate.set(date)                              │
│       → trackingSvc.getWorkout(date).subscribe →          │
│         workoutSession.set(workout)                          │
└───────────────────────────────────────��────────────────┘
```

### 5.2 Actualizar Workouts — El Pattern `_updateWorkout`

```
┌────────────────────────────────────────────────────────────────┐
│ Service.updateWorkout() llama:                                   │
│   1. state.updateWorkout(date, updater)                     │
│      → Mapea workouts → encuentra el del date               │
│      → Aplica updater → nuevo workout                      │
│      → trackingSubject.next(updatedTracking)            │
│   2. storage.setTrackingStorage(updated, userId)          │
│      → Persiste en localStorage                           │
└─────────────────────────────────────────────────────┘
```

### 5.3 Métodos de Lectura de Workouts (desde Service)

| Método                          | Retorna                                          | Como                           |
| ------------------------------- | ------------------------------------------------ | ------------------------------ |
| `getWorkout(date)`              | `Observable<WorkoutSessionVM \| undefined>`      | Filtra `workouts[]` por `date` |
| `getExercises(date)`            | `Observable<ExercisePerformanceVM[]>`            | `workout.exercises` del día    |
| `getExercise(date, exerciseId)` | `Observable<ExercisePerformanceVM \| undefined>` | Ejercicio específico           |
| `get getWorkouts()`             | `Observable<WorkoutSessionVM[]>`                 | Todos los workouts             |

---

## 6. Map —my-week → trackingSvc → domain → api

```
┌────────────────┐     ┌─────────────────────┐     ┌───────────────────────┐
│ MyWeek         │     │ PlanTrackingService │     │ PlanTrackingDomainSvc │
│                │     │ (Fachada)           │     │                      │
├────────────────┤     ├─────────────────────┤     ├───────────────────────┤
│ ngOnInit:      │     │ constructor:        │     │ initTracking():       │
│ trackingSvc.   │ ──▶ │ effect(user$) →     │ ──▶ │ api.getTrackingByUser()│
│ trackingPlanVM$│◀── │ initTracking(user)   │◀── │                       │
│                │     │                     │     │                       │
│ createTracking:│     │ createTracking():   │     │ createTracking():     │
│ trackingSvc.   │ ──▶ │ domain.createTracking│ ──▶ │ api.createTracking()   │
│ createTracking()│     │                     │     │                     │
│                │     │                     │     │                       │
│ createWorkout: │     │ createWorkout():     │     │ createWorkout():     │
│ trackingSvc.  │ ──▶ │ domain.createWorkout│ ──▶ │ api.updateTrackingDay│
│ createWorkout()│     │ → updateWorkout +   │     │                     │
│                │     │ persist           │     │                     │
└────────────────┘     └─────────────────────┘     └───────────────────────┘
                                          │
                                          ▼
                              ┌─────────────────────┐
                              │ PlanTrackingApi     │
                              │                   │
                              │ getTrackingByUser:│
                              │ exerciseSvc +      │
                              │ apollo.query +     │
                              │ wrapper to VM      │
                              └───────────────────┘
```

---

## 7. Flujo de Datos — Signals vs BehaviorSubject

```
┌─────────────────────────────────────────────────────────────────┐
│ BehaviorSubject (State)        Signal (Component)                  │
│ ─────────────────────         ──────────────────               │
│ trackingSubject ──────────▶ tracking = toSignal(tracking$)   │
│                              tracking$.subscribe()           │
│                                                                 │
│ En componente:                                                │
│   trackingSvc.trackingPlanVM$ → tracking$ observable         │
│   trackingSvc.tracking → tracking() signal                   │
│                                                                 │
│ WorkoutStateService usa:                                     │
│   tracking = toSignal(trackingSvc.trackingPlanVM$)          │
│   selectedDate = signal                                    │
│   workoutSession = signal                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Key Files

| Archivo                                                                          | Rol                                   |
| -------------------------------------------------------------------------------- | ------------------------------------- |
| `src/app/pages/my-week/my-week.ts`                                               | Componente, subscribe al tracking VM$ |
| `src/app/core/services/trackings/plan-tracking.service.ts`                       | Fachada, orchestration                |
| `src/app/core/services/trackings/plan-tracking.domain.ts`                        | Lógica de negocio                     |
| `src/app/core/services/trackings/plan-tracking.state.ts`                         | Estado reactivo (BehaviorSubject)     |
| `src/app/core/services/trackings/plan-tracking/api/plan-tranking.api.ts`         | Llamadas GraphQL                      |
| `src/app/core/services/trackings/plan-tracking/storage/plan-tracking.storage.ts` | localStorage cache                    |
| `src/app/core/services/workouts/workout.state.ts`                                | Día activo y workout activo           |

---

## 9. Notas de Implementación

1. **Cache-first**: Si hay storage, el tracking está disponible al instante (sin esperar API).
2. **Efecto encadenado**: `constructor effect` → `user$` → `initTracking` → `domain` → `api` → `persist`.
3. **No re-carga innecesaria**: `initTracking` verifica `userId` antes de llamar a API.
4. **`updateWorkout` pattern**: Toda actualización local va a `state.updateWorkout` + `storage.setTracking`.
5. **WorkoutStateService**: Servicio separado para gestionar el día/workout seleccionado independientemente del tracking completo.
6. **LocalDate**: Todas las comparaciones de fecha usan strings `yyyy-MM-dd` (comparación directa, sin objetos Date).
