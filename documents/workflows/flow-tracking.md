# Flow - Tracking (Rama SEGUIMIENTO)

## Propósito
Seguimiento semanal del entrenamiento del usuario con series, pesos y reps.

---

## Modelo de Datos

```
Tracking (semana de entrenamiento)
  └── WorkoutSession (WORKOUT | REST)
        ├── ExercisePerformance (series con pesos y reps)
        │     └── sets: { reps: number, weights?: number }[]
        └── ExtraActivity (running, bike, yoga, etc)
```

---

## Arquitectura

| Capa | Servicio |
|------|----------|
| Facade | `TrackingFacade` |
| Domain | `TrackingDomainService` |
| State | `WorkoutStateService` |
| API | `ApiService` |

---

## Flujo de Seguimiento

### 1. Tracking (Semana)
- Representa una semana de entrenamiento
- Contiene 7 WorkoutSessions (uno por día)
- Se crea a partir de un RoutinePlan (opcional)

### 2. WorkoutSession (Día Activo)
- Estado reactivo en `WorkoutStateService`
- Puede ser `WORKOUT`, `REST` o `NOT_STARTED`
- Contiene ExercisePerformances con sets completados

### 3. ExercisePerformance
- Vinculado a un Exercise de la biblioteca
- Registra: series, reps, pesos, notas
- Se transforma desde Exercise usando `exercises.wrapper.ts`

### 4. ExtraActivity
- Actividades adicionales: running, yoga, cycling, other
- Registra duración (minutos) y distancia (km)

---

## Analogía con Template

| Tracking | Template |
|----------|----------|
| `Tracking` (semana de seguimiento) | `RoutinePlan` (plan semanal) |
| `Workout` (día en seguimiento) | `RoutineDay` (día en creación) |

---

## Referencia

- Interfaces: `CONTRACT.md`
- Domain Service: `core/domain/tracking.domain.service.ts`
- State: `core/services/workouts/workout-state.service.ts`
- Wrappers: `shared/wrappers/tracking.wrapper.ts`, `exercises.wrapper.ts`
