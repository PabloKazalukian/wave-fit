# 📅 Mi Día — MyDay Flow

Documentación técnica de la página `MyDay`, su jerarquía de componentes y el flujo de datos para el seguimiento (tracking) de entrenamientos diarios.

---

## 🎨 Jerarquía de Componentes

```
MyDay (Página / Container)
  │
  └─→ TrackingWeekComponent (Vista semanal)
        │
        ├─→ NavigatorWeek (Navegación entre días del tracking)
        │
        └─→ TrackingWorkoutComponent (Contenedor de sesión de entrenamiento)
              │
              ├─→ ExerciseSelector (Búsqueda y selección de ejercicios)
              │
              └─→ WorkoutInProgess (Gestión de ejercicios activos)
                    │
                    └─→ AccordionItemComponent (Detalle de series, reps y peso)
```

---

## 🛠️ Servicios de Estado y Lógica

### [PlanTrackingService](/src/app/core/services/trackings/plan-tracking.service.ts)

Servicio principal que gestiona la persistencia y sincronización del tracking semanal.

- Provee el observable `trackingPlanVM$`.
- Maneja la comunicación con el API y el Storage local.
- Gestiona operaciones globales: `createTracking`, `completeTracking`, `createWorkout`.

### [WorkoutStateService](/src/app/core/services/workouts/workout-state.service.ts)

Servicio de estado (Feature State) específico para la sesión de entrenamiento actual.

- Expone señales (`signals`) reactivas: `selectedDate`, `workoutSession`, `exercises`.
- Centraliza la carga y actualización de ejercicios para el día seleccionado.
- Sincroniza cambios locales con el `PlanTrackingService`.

---

## 📊 Modelos de Datos (Interfaces)

### [TrackingVM](/src/app/shared/interfaces/tracking.interface.ts#L11)

El objeto raíz que contiene la información de la semana.

```typescript
export interface TrackingVM {
    id: string;
    userId: string;
    startDate: Date;
    endDate: Date;
    workouts?: WorkoutSessionVM[];
    planId?: string | null; // ID de la rutina semanal asignada
    completed: boolean;
}
```

### [WorkoutSessionVM](/src/app/shared/interfaces/tracking.interface.ts#L37)

Representa la sesión de un día específico dentro del tracking.

```typescript
export interface WorkoutSessionVM {
    id?: string;
    date: Date;
    exercises: ExercisePerformanceVM[];
    status: StatusWorkoutSession; // 'not_started' | 'complete' | 'rest'
}
```

### [ExercisePerformanceVM](/src/app/shared/interfaces/tracking.interface.ts#L44)

Detalle del rendimiento en un ejercicio.

```typescript
export interface ExercisePerformanceVM {
    exerciseId: string;
    name: string;
    series: number;
    sets: { reps: number; weights?: number }[];
    category: ExerciseCategory;
}
```

### [RoutineDayVM](/src/app/shared/interfaces/routines.interface.ts#L58)

Utilizado para mapear rutinas pre-definidas al tracking diario.

```typescript
export interface RoutineDayVM {
    id?: string;
    day: DayIndex;
    kind?: KindType; // 'REST' | 'WORKOUT'
    exercises?: Exercise[];
}
```

---

## 🔄 Flujo de Datos y Eventos

### 1. Inicialización de la Página

1. `MyDay` inyecta `PlanTrackingService`.
2. Se suscribe a `trackingPlanVM$`.
3. Si no hay tracking activo, muestra opciones para "Crear" o "Seleccionar" rutina.
4. Si hay tracking, renderiza `TrackingWeekComponent`.

### 2. Navegación y Selección de Día

1. `NavigatorWeek` permite cambiar la fecha seleccionada.
2. `WorkoutStateService.setDate(date)` actualiza la señal `selectedDate`.
3. Un `effect` en el service dispara `loadWorkout(date)`.
4. El componente `TrackingWorkoutComponent` reacciona al cambio de `workoutVM()` vía su facade.

### 3. Ejecución de Entrenamiento (WorkoutInProgess)

1. El usuario interactúa con `WorkoutInProgess`.
2. Las acciones (incrementar reps, añadir sets) se envían al `WorkoutInProgressFacade`.
3. El facade actualiza el `WorkoutStateService.updateExercises()`.
4. `WorkoutStateService` notifica al `PlanTrackingService` para persistencia inmediata/local.

### 4. Finalización

1. **Día**: `TrackingWorkoutFacade.startRoutineTracking()` marca el workout como completado en el API.
2. **Semana**: `TrackingWeekFacade.completeWeek()` dispara el proceso de cierre del tracking semanal a través de `PlanTrackingService.completeTracking()`.
