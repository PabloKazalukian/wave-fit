# 🏃 WorkoutStateService

Documentación del servicio de estado del workout activo (día seleccionado en tracking).

---

## 🏗️ Arquitectura

`WorkoutStateService` es de tipo **State + API** (Estado + delegación). Tiene estado reactivo propio (Signals) y una capa `api/`:

```
src/app/core/services/workouts/
├── workout.state.ts       # Estado reactivo (📄 el archivo se llama workout.state.ts, no workout-state.service.ts)
└── api/
    └── workout.api.ts     # WorkoutApi — mutation updateWorkoutSession
```

### ¿Por qué State?

Maneja el estado local de la sesión de entrenamiento activa (el día seleccionado y su workout). La persistencia/peticiones delega en `PlanTrackingService` y en la capa `api/`.

---

## 🧩 Signals

| Signal           | Tipo                               | Descripción                                 |
| ---------------- | ---------------------------------- | ------------------------------------------- |
| `selectedDate`   | `signal<LocalDate \| null>`        | **LocalDate** `"yyyy-MM-dd"` del día activo |
| `workoutSession` | `signal<WorkoutSessionVM \| null>` | Workout del día seleccionado                |
| `outOfDateRange` | `signal<boolean>`                  | Si la fecha activa quedó fuera del rango    |
| `exercises`      | `computed`                         | `workoutSession()?.exercises ?? []`         |

### Métodos

| Método                       | Descripción                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| `setDate(date: LocalDate)`   | Actualiza fecha + carga workout (`loadWorkout`)                                      |
| `updateExercises(exercises)` | Actualiza localmente y delega en `PlanTrackingService.setExercises(date, exercises)` |

`loadWorkout(date)` (privado): setea `selectedDate` y suscribe a `PlanTrackingService.getWorkout(date)` → actualiza `workoutSession`.

---

## 🔄 Efecto del constructor

Reacciona a `trackingPlanVM$` (vía `toSignal`):

1. Si no hay tracking ni workouts, no hace nada.
2. Si no hay `selectedDate`:
    - Toma `todayLocalDate()` del `DateService`.
    - Si hoy está dentro de `[startDate, endDate]` → `selectedDate = hoy`.
    - Si no → `selectedDate = primer workout` y marca `outOfDateRange = true`.
3. Si ya hay `selectedDate`, recarga el workout de esa fecha (`getWorkout(selectedDate)`).

Usa `DateService` para comparar fechas (strings determinísticas) y `LocalDate`.

---

## 🏛️ WorkoutApi (`api/workout.api.ts`)

| Método                                     | Query/Mutation           | Descripción                   |
| ------------------------------------------ | ------------------------ | ----------------------------- |
| `updateWorkoutSession(payload, weekLogId)` | `UPDATE_WORKOUT_SESSION` | Wrappe a API y de vuelta a VM |

Consumido por `PlanTrackingDomainService.updateWorkoutSession()`.

Queries en `core/apollo/workout.queries.ts`: `CREATE_WORKOUT_SESSION`, `UPDATE_WORKOUT_SESSION` (`REMOVE_WORKOUT_SESSION` comentado).

---

## Relación con PlanTrackingService

```
WorkoutStateService                    PlanTrackingService
       │                                      │
       │── loadWorkout() ────────────────────→│── getWorkout(date)
       │                                      │
       │── updateExercises() ───────────────→│── setExercises(date, exercises) [debounce 4s]
       │                                      │── PlanTrackingDomainService
       │                                      │── PlanTrackingApi
       │                                      │── WorkoutApi
```

---

## Interfaces

```typescript
type LocalDate = string; // "yyyy-MM-dd"

interface WorkoutSessionVM {
    id?: string;
    date: LocalDate; // ✅ LocalDate, no Date
    exercises: ExercisePerformanceVM[];
    extras?: string[];
    status: StatusWorkoutSession;
    notes?: string;
    planId?: string;
}

type StatusWorkoutSession = 'not_started' | 'complete' | 'rest' | 'edited';
```

---

## Notas

- **Archivo:** `workout.state.ts` (clase `WorkoutStateService`), NO `workout-state.service.ts`.
- `selectedDate` es `LocalDate` (string), no `Date`.
- Delega la persistencia a `PlanTrackingService` y las mutations a `WorkoutApi`.
- `outOfDateRange` permite mostrar advertencias cuando el día activo queda fuera de la semana de tracking.
