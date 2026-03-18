# 🏃 WorkoutStateService

Documentación del servicio de estado de workout.

---

## 🏗️ Arquitectura

WorkoutStateService es un servicio de **State** puro:

```
workout-state.service.ts  # Estado reactivo con Signals
```

### ¿Por qué State?

Este servicio solo maneja el estado local de la sesión de entrenamiento activa. No tiene lógica de negocio compleja ni necesita persistencia (delega a PlanTrackingService).

---

## 📁 Archivo

```
src/app/core/services/workouts/
└── workout-state.service.ts
```

---

## API Pública

### Signals

| Signal           | Tipo                       | Descripción                             |
| ---------------- | -------------------------- | --------------------------------------- |
| `selectedDate`   | `Date \| null`             | Fecha del día seleccionado              |
| `workoutSession` | `WorkoutSessionVM \| null` | Workout activo                          |
| `outOfDateRange` | `boolean`                  | Indica si la fecha está fuera del rango |
| `exercises`      | `computed`                 | Ejercicios del workout actual           |

### Métodos

| Método                       | Descripción                                               |
| ---------------------------- | --------------------------------------------------------- |
| `setDate(date)`              | Cambia la fecha y carga el workout                        |
| `updateExercises(exercises)` | Actualiza ejercicios y sincroniza con PlanTrackingService |

---

## Arquitectura de Datos

```
WorkoutStateService
    │
    ├── selectedDate (signal) → Fecha seleccionada por el usuario
    │
    ├── workoutSession (signal) → Workout del día seleccionado
    │
    ├── exercises (computed) → Ejercicios del workout actual
    │
    └── outOfDateRange (signal) → Si la fecha está fuera del tracking
```

---

## Flujo de Datos

### Inicialización (Constructor)

```
1. Crea effect() que reacciona a cambios en tracking
2. Detecta si hay un tracking activo
3. Determina la fecha inicial:
   - Si hoy está en rango: usa hoy
   - Si no: usa la primera fecha del tracking
4. Carga el workout correspondiente
```

### setDate(date)

```
1. Actualiza selectedDate signal
2. Llama loadWorkout(date)
3. Suscribe a PlanTrackingService.getWorkout(date)
4. Actualiza workoutSession con el resultado
```

### updateExercises(exercises)

```
1. Obtiene la fecha seleccionada
2. Llama PlanTrackingService.setExercises() para persistir
3. Actualiza localmente workoutSession
```

---

## Relación con PlanTrackingService

```
WorkoutStateService                    PlanTrackingService
       │                                      │
       │── loadWorkout() ────────────────────→│── getWorkout(date)
       │                                      │
       │── updateExercises() ───────────────→│── setExercises(date, exercises)
       │                                      │
       │                                      │── PlanTrackingDomainService
       │                                      │── PlanTrackingApi
       │                                      │── PlanTrackingStorage
```

---

## Interfaces

```typescript
interface WorkoutSessionVM {
    id?: string;
    date: Date;
    exercises: ExercisePerformanceVM[];
    status: StatusWorkoutSession;
}

interface ExercisePerformanceVM {
    exerciseId: string;
    name: string;
    series: number;
    sets: { reps: number; weights?: number }[];
    category: ExerciseCategory;
}

type StatusWorkoutSession = 'not_started' | 'complete' | 'rest';
```

---

## Notas

- No tiene caché propio, siempre consulta a PlanTrackingService
- El effect en el constructor sincroniza con el tracking global
- Delega la persistencia a PlanTrackingService
