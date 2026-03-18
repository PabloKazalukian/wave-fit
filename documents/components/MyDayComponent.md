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

## 🏗️ Arquitectura de Servicios

El tracking utiliza la arquitectura **Domain + (API | Storage) + State**:

```
PlanTrackingService
    │
    ├── PlanTrackingDomainService (Lógica de negocio)
    │       │
    │       ├── PlanTrackingApi (Llamadas GraphQL)
    │       │
    │       └── PlanTrackingStorage (Persistencia local)
    │
    └── PlanTrackingStateService (Estado reactivo)
```

### Capas y Responsabilidades

| Capa        | Archivo                                                  | Responsabilidad                                |
| ----------- | -------------------------------------------------------- | ---------------------------------------------- |
| **Service** | `plan-tracking.service.ts`                               | Fachada pública, coordina domain y state       |
| **Domain**  | `plan-tracking-domain.service.ts`                        | Lógica de negocio, orquestación de API/Storage |
| **API**     | `plan-tracking/api/plan-tranking-api.service.ts`         | Llamadas GraphQL al backend                    |
| **Storage** | `plan-tracking/storage/plan-tracking-storage.service.ts` | Persistencia en localStorage                   |
| **State**   | `plan-tracking-state.service.ts`                         | Estado reactivo con BehaviorSubject y Signals  |

### PlanTrackingStateService

Estado reactivo para el tracking semanal.

- `tracking$`: Observable del tracking actual
- `tracking`: Signal del tracking actual
- `loading`: Signal de carga general
- `loadingTracking`: Signal de carga de tracking
- `loadingWorkoutCreation`: Signal del estado de creación de workouts

### PlanTrackingDomainService

Contiene la lógica de negocio principal:

- Inicialización del tracking al detectar usuario
- Creación de tracking y workouts
- Sincronización entre API y Storage
- Efectos para reaccionar a cambios de usuario

### PlanTrackingService

Fachada que expone los métodos públicos:

- `createTracking(planId?)`: Crea un nuevo tracking semanal
- `createWorkout(dateWorkout)`: Crea workout para un día
- `toggleExercise(date, exercise)`: Toggle de ejercicio
- `removeExercise(date, exerciseId)`: Elimina ejercicio
- `setWorkouts(day, workout)`: Actualiza workouts
- `setExercises(date, exercises)`: Actualiza ejercicios

---

## 🛠️ WorkoutStateService

Servicio de estado específico para la sesión de entrenamiento actual.

- `selectedDate`: Signal de fecha seleccionada
- `workoutSession`: Signal del workout activo
- `exercises`: Computed signal con los ejercicios del workout
- `setDate(date)`: Cambia la fecha y carga el workout
- `updateExercises(exercises)`: Actualiza ejercicios y sincroniza con PlanTrackingService

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
    planId?: string | null;
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
    status: StatusWorkoutSession;
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

---

## 🔄 Flujo de Datos y Eventos

### 1. Inicialización de la Página

1. `MyDay` inyecta `PlanTrackingService`
2. `PlanTrackingDomainService` detecta usuario y llama `initTracking()`
3. Se suscribe a `trackingPlanVM$` (alias de `tracking$`)
4. Si no hay tracking activo, muestra opciones para "Crear" o "Seleccionar" rutina
5. Si hay tracking, renderiza `TrackingWeekComponent`

### 2. Navegación y Selección de Día

1. `NavigatorWeek` permite cambiar la fecha seleccionada
2. `WorkoutStateService.setDate(date)` actualiza la signal `selectedDate`
3. Un efecto en `WorkoutStateService` dispara `loadWorkout(date)`
4. El componente `TrackingWorkoutComponent` reacciona al cambio de `workoutSession()`

### 3. Ejecución de Entrenamiento (WorkoutInProgess)

1. El usuario interactúa con `WorkoutInProgess`
2. Las acciones se envían al `WorkoutInProgressFacade`
3. El facade actualiza `WorkoutStateService.updateExercises()`
4. `WorkoutStateService` sincroniza con `PlanTrackingService`
5. `PlanTrackingService` actualiza Storage (persistencia inmediata)

### 4. Finalización

1. **Día**: `TrackingWorkoutFacade.startRoutineTracking()` marca el workout como completado
2. **Semana**: `TrackingWeekFacade.completeWeek()` cierra el tracking semanal

---

## 📁 Archivos Relacionados

```
src/app/core/services/trackings/
├── plan-tracking.service.ts           # Fachada
├── plan-tracking-domain.service.ts    # Lógica de negocio
├── plan-tracking-state.service.ts     # Estado reactivo
└── plan-tracking/
    ├── api/
    │   └── plan-tranking-api.service.ts    # GraphQL API
    └── storage/
        └── plan-tracking-storage.service.ts # localStorage
```
