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

| Documento                                            | Página        | Descripción                           |
| ---------------------------------------------------- | ------------- | ------------------------------------- |
| [MyWeekComponent.md](./MyWeekComponent.md)           | /my-week      | Seguimiento semanal de entrenamientos |
| [RoutinePlanComponent.md](./RoutinePlanComponent.md) | /plans/create | Creación de rutinas semanales         |

---

## Rutas y Componentes

| Ruta                    | Página                    | Servicios                                |
| ----------------------- | ------------------------- | ---------------------------------------- |
| `/auth/*`               | Login, Register, Callback | AuthService                              |
| `/home`                 | Dashboard                 | -                                        |
| `/exercises`            | Biblioteca de ejercicios  | ExercisesService                         |
| `/plans`                | Lista de planes           | PlansService                             |
| `/plans/create`         | Creación de plan          | PlansService, DayPlanStateService        |
| `/routines/show/:id`    | Ver rutina                | RoutinesService                          |
| `/my-week`              | Seguimiento semanal       | PlanTrackingService, WorkoutStateService |
| `/user/trackings`       | Lista de trackings        | PlanTrackingService                      |
| `/user/trackings/:id`   | Ver tracking              | PlanTrackingService                      |
| `/user/trackings/stats` | Estadísticas              | PlanTrackingService                      |
| `/user`                 | Perfil                    | AuthService, UserService                 |

---

## Jerarquías de Componentes

### MyWeek (/my-week)

```
MyWeek
  └─→ TrackingWeekComponent
        ├─→ NavigatorWeek
        ├─→ TrackingActive
        └─→ TrackingWorkoutComponent
              ├─→ WorkoutRoutineSelector
              ├─→ WorkoutActionsMenu
              └─→ WorkoutInProgress
                    └─→ WorkoutEdition / WorkoutCompleteList
```

### Plans (/plans/create)

```
Plans (Lista)
  └─→ Create (Creación)
        └─→ WeeklyRoutinePlannerComponent
              ├─→ DaysRoutineProgressComponent
              ├─→ DayOfRoutineComponent
              └─→ WeekDayCellComponent
                    └─→ RoutineListBoxComponent
                          ├─→ RoutineExercisesComponent
                          └─→ RoutineExerciseFormComponent
                                └─→ ExerciseCreateComponent
```

### Trackings (/user/trackings)

```
Trackings (Lista)
  └─→ Show
        └─→ TrackingWeekComponent
        └─→ TrackingWorkoutComponent
```

---

## Facades

Los facades coordinan la vista con los servicios de dominio.

| Facade                  | Ubicación                                               | Responsabilidad          |
| ----------------------- | ------------------------------------------------------- | ------------------------ |
| WorkoutInProgressFacade | shared/components/widgets/tracking/tracking-workout/... | Coordina workout activo  |
| TrackingWeekFacade      | shared/components/widgets/tracking/tracking-week/...    | Coordina vista semanal   |
| TrackingWorkoutFacade   | shared/components/widgets/tracking/tracking-workout/... | Coordina workout del día |

---

## Estructura de Carpetas

```
src/app/
├── pages/
│   ├── auth/
│   ├── home/
│   ├── exercises/
│   ├── plans/
│   │   ├── plans.ts
│   │   └── create/
│   ├── routines/
│   ├── my-week/
│   ├── trackings/
│   │   ├── trackings.ts
│   │   ├── show/
│   │   └── stats/
│   └── user/
├── shared/
│   ├── components/widgets/
│   │   └── tracking/
│   │       ├── tracking-week/
│   │       │   ├── tracking-week.ts
│   │       │   ├── tracking-week.facade.ts
│   │       │   ├── navigator-week/
│   │       │   └── tracking-active/
│   │       └── tracking-workout/
│   │           ├── tracking-workout.ts
│   │           ├── tracking-workout.facade.ts
│   │           ├── workout-in-progress/
│   │           ├── workout-actions-menu/
│   │           ├── workout-routine-selector/
│   │           ├── workout-complete-list/
│   │           └── workout-edition/
│   └── components/ui/
│       ├── button/
│       ├── card/
│       └── ...
└── app.routes.ts
```

MyWeek
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
│ ├── auth/
│ ├── home/
│ ├── exercises/
│ ├── routines/
│ ├── my-week/
│ └── user/
├── shared/
│ ├── components/widgets/
│ │ └── tracking/
│ │ ├── tracking-week/
│ │ ├── tracking-workout/
│ │ │ ├── workout-in-progess/
│ │ │ │ └── workout-in-progress.facade.ts
│ │ │ └── workout-in-progess.ts
│ │ └── ...
│ └── components/ui/
│ ├── button/
│ ├── card/
│ └── ...
└── app.routes.ts

```

```
