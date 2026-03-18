# 🧩 Componentes — Índice

Documentación de la arquitectura de componentes del frontend.

---

## Arquitectura de Componentes

```
Dumb Components → Facade → Domain Service → (API/Storage Services + State Service)
```

### Flujo de datos

```
┌──────────────┐      ┌──────────┐      ┌─────────────────┐
│    Dumb      │ ───→ │  Facade  │ ───→ │ Domain Service  │
│ Components   │      │          │      │                 │
└──────────────┘      └──────────┘      └────────┬────────┘
                                                 │
                              ┌──────────────────┼──────────────────┐
                              ▼                  ▼                  ▼
                        ┌──────────┐      ┌──────────┐      ┌──────────┐
                        │   API    │      │  Storage │      │  State   │
                        └──────────┘      └──────────┘      └──────────┘
```

---

## Componentes Documentados

| Documento                                            | Página       | Descripción                           |
| ---------------------------------------------------- | ------------ | ------------------------------------- |
| [MyDayComponent.md](./MyDayComponent.md)             | /my-day      | Seguimiento de entrenamientos diarios |
| [RoutinePlanComponent.md](./RoutinePlanComponent.md) | /routines/\* | Creación de rutinas semanales         |

---

## Rutas y Componentes

| Ruta          | Página                    | Servicios                                           |
| ------------- | ------------------------- | --------------------------------------------------- |
| `/auth/*`     | Login, Register, Callback | AuthService                                         |
| `/home`       | Dashboard                 | -                                                   |
| `/exercises`  | Biblioteca de ejercicios  | ExercisesService                                    |
| `/routines/*` | Gestión de rutinas        | PlansService, DayPlanStateService, RoutinesServices |
| `/my-day`     | Tracking del día          | PlanTrackingService, WorkoutStateService            |
| `/user`       | Perfil                    | AuthService, UserService                            |

---

## Jerarquías de Componentes

### MyDay (/my-day)

```
MyDay
  └─→ TrackingWeekComponent
        ├─→ NavigatorWeek
        └─→ TrackingWorkoutComponent
              ├─→ ExerciseSelector
              └─→ WorkoutInProgess
                    └─→ AccordionItemComponent
```

### RoutinePlan (/routines/\*)

```
RoutinePlanForm
  └─→ WeeklyRoutinePlannerComponent
        ├─→ DaysRoutineProgressComponent
        ├─→ DayOfRoutineComponent
        └─→ WeekDayCellComponent
              └─→ RoutineListBoxComponent
                    ├─→ RoutineExercisesComponent
                    └─→ RoutineExerciseFormComponent
                          └─→ ExerciseCreateComponent
```

---

## Facades

Los facades coordinan la vista con los servicios de dominio.

| Facade                  | Ubicación                              | Responsabilidad              |
| ----------------------- | -------------------------------------- | ---------------------------- |
| WorkoutInProgressFacade | shared/components/widgets/tracking/... | Coordina workout activo      |
| TrackingWeekFacade      | -                                      | Coordina vista semanal       |
| TrackingWorkoutFacade   | -                                      | Coordina workout del día     |
| RoutineCreationFacade   | -                                      | Coordina creación de rutinas |

---

## Estructura de Carpetas

```
src/app/
├── pages/
│   ├── auth/
│   ├── home/
│   ├── exercises/
│   ├── routines/
│   ├── my-day/
│   └── user/
├── shared/
│   ├── components/widgets/
│   │   └── tracking/
│   │       ├── tracking-week/
│   │       ├── tracking-workout/
│   │       │   ├── workout-in-progess/
│   │       │   │   └── workout-in-progress.facade.ts
│   │       │   └── workout-in-progess.ts
│   │       └── ...
│   └── components/ui/
│       ├── button/
│       ├── card/
│       └── ...
└── app.routes.ts
```
