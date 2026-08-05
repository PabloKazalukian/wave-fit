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

| Ruta                  | Página                    | Servicios                                |
| --------------------- | ------------------------- | ---------------------------------------- |
| `/auth/*`             | Login, Register, Callback | AuthService                              |
| `/home`               | Dashboard                 | -                                        |
| `/exercises`          | Biblioteca de ejercicios  | ExercisesService                         |
| `/plans`              | Lista de planes           | PlansService                             |
| `/plans/create`       | Creación de plan          | PlansService, DayPlanStateService        |
| `/routines/show/:id`  | Ver rutina                | RoutinesService                          |
| `/my-week`            | Seguimiento semanal       | PlanTrackingService, WorkoutStateService |
| `/trackings`          | Lista de trackings        | PlanTrackingService                      |
| `/trackings/show/:id` | Ver tracking              | PlanTrackingService                      |
| `/trackings/stats`    | Estadísticas              | PlanTrackingService                      |
| `/user`               | Perfil                    | AuthService, UserService                 |

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

### Trackings (/trackings)

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

---

## Facades

Los facades coordinan la vista con los servicios de dominio.

| Facade                  | Responsabilidad              |
| ----------------------- | ---------------------------- |
| WorkoutInProgressFacade | Coordina workout activo      |
| TrackingWeekFacade      | Coordina vista semanal       |
| TrackingWorkoutFacade   | Coordina workout del día     |
| RoutineCreationFacade   | Coordina creación de rutinas |

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
│   ├── exercises/
│   ├── plans/
│   │   ├── plans.ts         # Lista de planes
│   │   └── create/          # Creación
│   ├── routines/
│   │   └── show/
│   ├── my-week/
│   ├── trackings/
│   │   ├── trackings.ts      # Lista
│   │   ├── show/           # Ver detalle
│   │   └── stats/          # Estadísticas
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
