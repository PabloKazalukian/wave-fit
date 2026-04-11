# 📊 PlanTrackingService

Documentación del servicio de tracking de planes de entrenamiento.

---

## 🏗️ Arquitectura

PlanTrackingService es el servicio de **mayor complejidad** en la aplicación, siguiendo el patrón completo:

```
plan-tracking.service.ts     # Fachada
plan-tracking.domain.ts  # Domain Service (lógica de negocio)
plan-tracking.state.ts  # State (Signals)
plan-tracking/
├── api/
│   └── plan-tracking.api.ts    # GraphQL queries/mutations
└── storage/
    └── plan-tracking.storage.ts # Persistencia local
```

### ¿Por qué Domain + API + Storage + State?

Este servicio maneja la lógica más compleja de la app:
- Persistencia remota (API) y local (Storage)
- Estado reactivo (State/Signals)
- Lógica de negocio significativa (Domain)

---

## 📁 Archivo

```
src/app/core/services/trackings/
├── plan-tracking.service.ts
├── plan-tracking.domain.ts
├── plan-tracking.state.ts
├── tracking-list.state.ts
├── plan-tracking/
│   ├── api/
│   │   └── plan-tracking.api.ts
│   └── storage/
│       └── plan-tracking.storage.ts
```

---

## API Pública

### Signals (State)

| Signal              | Tipo                       | Descripción                           |
| ----------------- | -------------------------- | ----------------------------------- |
| `activePlanId`    | `string \| null`            | ID del plan activo                  |
| `tracking`        | `Tracking \| null`         | Tracking de la semana actual        |
| `workoutSessions`  | `WorkoutSession[]`         | Lista de sesiones de workout        |
| `isLoading`       | `boolean`                | Estado de carga                    |
| `error`          | `string \| null`           | Último error                     |

### Métodos

| Método                           | Descripción                                             |
| ------------------------------- | ----------------------------------------------------- |
| `loadWeek(startOfWeek)`            | Carga el tracking de una semana específica              |
| `setActivePlan(planId)`         | Establece el plan activo                              |
| `getWorkout(date)`             | Obtiene workout para una fecha                     |
| `setExercises(date, exercises)` | Guarda ejercicios de un workout                  |
| `completeWorkout(date)`       | Marca workout como completado                      |
| `getStats()`                  | Obtiene estadísticas del tracking               |

---

## Arquitectura de Datos

```
PlanTrackingService
    │
    ├── PlanTrackingDomainService
    │       │
    │       ├── getOrCreateTracking()
    │       ├── syncTracking()
    │       └── calculateStats()
    │
    ├── PlanTrackingApi
    │       │
    │       ├── getTrackingWeek(startOfWeek)
    │       ├── createTracking()
    │       ├── updateWorkoutSession()
    │       └── setExercises()
    │
    ├── PlanTrackingStorage
    │       │
    │       ├── getCachedTracking()
    │       └── cacheTracking()
    │
    └── PlanTrackingState (Signals)
            │
            ├── tracking signal
            ├── workoutSessions signal
            └── isLoading signal
```

---

## Flujo de Datos

### loadWeek(startOfWeek)

```
1. Busca en storage local (PlanTrackingStorage)
2. Si existe y no expiró → retorna del cache
3. Si no → llama a API (PlanTrackingApi)
4. Obtiene tracking de la semana
5. Actualiza storage local
6. Actualiza signals (PlanTrackingState)
```

### setExercises(date, exercises)

```
1. Valida ejercicios con Domain
2. Llama a API para persistir
3. Actualiza storage local
4. Actualiza signals localmente
```

---

## Interfaces

```typescript
interface Tracking {
    id: string;
    planId: string;
    startOfWeek: Date;
    workouts: WorkoutSession[];
    extraSessions: ExtraSession[];
    status: TrackingStatus;
}

interface WorkoutSession {
    id: string;
    date: Date;
    exercises: ExercisePerformance[];
    status: 'not_started' | 'in_progress' | 'complete';
}

interface ExercisePerformance {
    exerciseId: string;
    name: string;
    series: number;
    sets: { reps: number; weight?: number }[];
}

interface Stats {
    totalWorkouts: number;
    completedWorkouts: number;
    totalVolume: number;
    frequency: number;
}
```

---

## Notas

- Es el único servicio con patrón Domain + API + Storage + State
- Utiliza Signals para estado reactivo
- Cachea tracking en localStorage para offline
- Sincroniza con servidor cuando hay conectividad