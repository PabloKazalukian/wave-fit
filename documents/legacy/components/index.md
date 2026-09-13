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

| Documento                                                    | Página        | Descripción                               |
| ------------------------------------------------------------ | ------------- | ----------------------------------------- |
| [MyWeekComponent.md](./MyWeekComponent.md)                   | /my-week      | Seguimiento semanal de entrenamientos     |
| [RoutinePlanComponent.md](./RoutinePlanComponent.md)         | /plans/create | Creación de rutinas semanales             |
| [CoachComponent.md](./CoachComponent.md)                     | /coach        | Coach AI: generación y gestión de planes  |
| [TrainingHistoryComponent.md](./TrainingHistoryComponent.md) | /user/history | Calendario del historial de entrenamiento |

---

## Rutas y Componentes

| Ruta                    | Página                    | Servicios                                |
| ----------------------- | ------------------------- | ---------------------------------------- |
| `/auth/*`               | Login, Register, Callback | AuthService                              |
| `/home`                 | Dashboard                 | -                                        |
| `/coach`                | Coach AI                  | CoachService, UserProfileService         |
| `/exercises`            | Biblioteca de ejercicios  | ExercisesService (create comentado)      |
| `/plans`                | Lista de planes           | PlansService                             |
| `/plans/create`         | Creación de plan          | PlansService, DayPlanStateService        |
| `/routines/show/:id`    | Ver rutina                | RoutinesService                          |
| `/my-week`              | Seguimiento semanal       | PlanTrackingService, WorkoutStateService |
| `/my-week/success`      | Semana completada         | TrackingListState + WeeklyTrackings      |
| `/user`                 | Perfil                    | UserProfileService, AuthService          |
| `/user/profile`         | Editar perfil             | UserProfileService, UserProfileDomain    |
| `/user/history`         | Historial (calendario)    | TrainingHistoryService                   |
| `/user/trackings`       | Lista de trackings        | PlanTrackingService                      |
| `/user/trackings/:id`   | Ver tracking              | PlanTrackingService                      |
| `/user/trackings/stats` | Estadísticas              | PlanTrackingService                      |

> ⚠️ Nota: las rutas de trackings y stats viven bajo **`/user`** (no `/trackings`). `User` reemplazó a `UserService` (no existe); perfil → `UserProfileService`.

---

## Jerarquías de Componentes

### MyWeek (/my-week)

```
MyWeek
  └─→ TrackingWeekComponent
        ├─→ InfoCard (Progresión Semanal)
        ├─→ WeeklyStats (carrusel)
        ├─→ ExtraSessionForm (diálogo)
        ├─→ NavigatorWeek
        └─→ TrackingWorkoutComponent
              ├─→ WorkoutDayStats (carrusel)
              ├─→ ExtraSessionContent
              └─→ WorkoutInProgress / WorkoutEdition / WorkoutCompleteList
                    └─→ WorkoutActionsMenu
                          └─→ WorkoutRoutineSelector
```

### Coach (/coach)

```
Coach
  ├─→ show-user-profile-data (perfil, solo lectura)
  ├─→ form-user-profile      (setup básico) → completed
  ├─→ list-plan-training     (historial)    → viewPlan
  │     └─→ numeric-pagination
  ├─→ coach-generate-plan    (generador IA)
  │     └─→ coach-manage-with-plan
  │           └─→ CoachManageWithPlanFacade → CoachNavigatorWeek + CoachShowWorkout
  └─→ coach-manage           (plan guardado por id)
        └─→ CoachManageWithPlanFacade → CoachNavigatorWeek + CoachShowWorkout
```

### Plans (/plans/create)

```
Plans (Lista)
  └─→ Create (Creación)
        └─→ WeeklyRoutinePlannerComponent
              ├─→ DaysRoutineProgressComponent
              ├─→ DayOfRoutineComponent
              └─→ WeekDayCellComponent
                    └─→ RoutineFormComponent (facade: routine-form.facade.ts)
```

### Trackings (/user/trackings)

```
Trackings (Lista)
  └─→ Trackings
        └─→ TrackingWeekComponent
  └─→ Show/:id
        └─→ TrackingWeekComponent
        └─→ TrackingWorkoutComponent
  └─→ Stats
        └─→ StatsComponent
```

### TrainingHistory (/user/history)

```
History (calendario mensual, self-contained)
  └─→ TrainingHistoryService.getTrainingCalendar(year, month)
```

---

## Facades

Los facades coordinan la vista con los servicios de dominio.

| Facade                    | Responsabilidad                                                      |
| ------------------------- | -------------------------------------------------------------------- |
| WorkoutInProgressFacade   | Coordina workout activo                                              |
| TrackingWeekFacade        | Coordina vista semanal                                               |
| TrackingWorkoutFacade     | Coordina workout del día                                             |
| RoutineCreationFacade     | Coordina creación de rutinas                                         |
| CoachManageWithPlanFacade | Coordina vista de un plan IA (guardado o generado) y su confirmación |

---

## Estructura de Carpetas

```
src/app/
├── pages/
│   ├── auth/
│   │   ├── login/
│   │   ├── register/
│   │   └── callback/
│   ├── home/
│   ├── coach/
│   ├── exercises/              # + exercises.routes.ts (create comentado)
│   ├── plans/                  # + plans.routes.ts
│   │   ├── plans.ts            # Lista de planes
│   │   └── create/             # Creación
│   ├── routines/
│   │   └── show/               # + routines.routes.ts
│   ├── my-week/                # + my-week.routes.ts
│   │   ├── my-week.ts
│   │   └── success/            # /my-week/success
│   ├── trackings/              # tracking.routes.ts (bajo /user/trackings)
│   │   ├── trackings.ts        # Lista
│   │   ├── show/               # Ver detalle
│   │   └── stats/              # Estadísticas
│   └── user/
│       ├── user.ts             # Perfil
│       ├── profile/            # Editar perfil
│       └── history/            # Historial (calendario)
├── shared/
│   ├── components/widgets/
│   │   ├── tracking/
│   │   │   ├── tracking-week/   # tracking-week, navigator-week, weekly-stats, tracking-active
│   │   │   └── tracking-workout/ # tracking-workout, workout-in-progress, workout-actions-menu,
│   │   │                        # workout-routine-selector, workout-complete-list, workout-edition,
│   │   │                        # workout-day-stats
│   │   └── plans/
│   │       ├── weekly-routine-planner/ (+ routine-days-progress)
│   │       ├── day-of-routine/
│   │       ├── week-day-cell/
│   │       └── routine-form/    # + routine-form.facade.ts
│   └── components/ui/
│       ├── button/
│       ├── card/
│       └── ...
└── app.routes.ts
```

---

## Estado y Patrones

| Capa                | Responsabilidad              | Ejemplo                   |
| ------------------- | ---------------------------- | ------------------------- |
| **Dumb Components** | Solo renderizado, sin lógica | Button, Card              |
| **Facade**          | Coordina la vista            | WorkoutInProgressFacade   |
| **Domain Service**  | Lógica de negocio            | PlanTrackingDomainService |
| **State Service**   | Estado reactivo (Signals)    | WorkoutStateService       |
| **API Service**     | Llamadas GraphQL             | PlanTrackingApi           |
| **Storage**         | Persistencia local           | PlanTrackingStorage       |

---

## HTML Semántico (OBLIGATORIO en templates)

Los templates `.html` deben usar etiquetas semánticas en vez de `div` a secas. Referencia de buenas prácticas: `src/app/pages/auth/callback/callback.html`.

| Etiqueta                  | Uso                                               |
| ------------------------- | ------------------------------------------------- |
| `<section>`               | Bloque temático autocontenido (widget, tarjeta)   |
| `<header>`                | Cabecera de un bloque/sección (título + acciones) |
| `<footer>`                | Pie de un bloque/sección                          |
| `<nav>`                   | Navegación (paginación, dots de carrusel, menús)  |
| `<h1>`–`<h6>`             | Títulos respetando la jerarquía (h2 > h3 > h4...) |
| `<ul>`/`<ol>` + `<li>`    | Listas de datos (filas de una lista, stats, etc.) |
| `<p>`                     | Párrafos de texto                                 |
| `<a>`                     | Enlaces                                           |
| `<button>`                | Acciones clicables                                |
| `<aside>`                 | Contenido complementario                          |
| `<figure>`/`<figcaption>` | Ilustraciones con pie                             |

Reglas:

1. **Solo `<div>` para layouts puros** (grid/flex sin valor semántico).
2. Respetar la **jerarquía de encabezados**.
3. **Filas label/value → `<ul>` con `<li>`**, no un `<div>` por fila.
4. Usar `aria-label`/`aria-labelledby` en secciones, navegaciones y controles sin texto visible.
5. Ejemplo de widget bien estructurado: `weekly-stats.html` (section > header + nav + ul/li).
