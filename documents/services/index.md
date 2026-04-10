# 📚 Servicios — Índice

Documentación de la arquitectura de servicios del frontend.

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                         FACADE                                  │
│  (Coordinación de vistas, consume Domain Services)             │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      DOMAIN SERVICE                             │
│  (Lógica de negocio, solo para funcionalidades complejas)       │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐    ┌──────────┐    ┌──────────┐
        │   API    │    │  STORAGE │    │  STATE   │
        │ (GraphQL)│    │(localSt.)│    │ (Signals)│
        └──────────┘    └──────────┘    └──────────┘
```

### Patrones según complejidad

| Complejidad | Patrón                            | Ejemplos                        |
| ----------- | --------------------------------- | ------------------------------- |
| **Alta**    | Domain + (API \| Storage) + State | PlanTracking                    |
| **Media**   | API + Storage + State             | Plans                           |
| **Baja**    | API + Service (juntos)            | Exercises, Routines, User, Auth |

---

## Servicios Documentados

### Tracking

| Documento                                              | Descripción                                  |
| ------------------------------------------------------ | -------------------------------------------- |
| [MyWeekComponent.md](../components/MyWeekComponent.md) | Componente My Week con arquitectura completa |

### Plans

| Documento                                                        | Descripción                   |
| ---------------------------------------------------------------- | ----------------------------- |
| [RoutinePlanComponent.md](../components/RoutinePlanComponent.md) | Creación de rutinas semanales |

### Services

| Documento                                                  | Servicio                                      | Arquitectura  |
| ---------------------------------------------------------- | --------------------------------------------- | ------------- |
| [AuthenticationAndApollo.md](./AuthenticationAndApollo.md) | AuthService, TokenStorage, CredentialsService | API + Service |
| [ExercisesService.md](./ExercisesService.md)               | ExercisesService                              | API + Service |
| [RoutinesService.md](./RoutinesService.md)                 | RoutinesService, RoutinesApiService           | API + Service |
| [UserService.md](./UserService.md)                         | UserService                                   | API + Service |
| [WorkoutStateService.md](./WorkoutStateService.md)         | WorkoutStateService                           | State         |

---

## Resumen de Servicios

### Servicios con Domain (Alta complejidad)

| Servicio     | Domain | API | Storage | State |
| ------------ | ------ | --- | ------- | ----- |
| PlanTracking | ✅     | ✅  | ✅      | ✅    |

### Servicios con State (Media complejidad)

| Servicio     | API | Storage | State |
| ------------ | --- | ------- | ----- |
| Plans        | ✅  | ✅      | ✅    |
| DayPlan      | ❌  | ❌      | ✅    |
| Workouts     | ❌  | ❌      | ✅    |
| TrackingList | ❌  | ❌      | ✅    |
| ExtraSession | ✅  | ✅      | ❌    |

### Servicios Simples (Baja complejidad)

| Servicio    | API | Service |
| ----------- | --- | ------- |
| Exercises   | ✅  | ✅      |
| Routines    | ✅  | ✅      |
| User        | ✅  | ✅      |
| Auth        | ✅  | ✅      |
| Credentials | ❌  | ✅      |
| Date        | ❌  | ✅      |
| Warmup      | ❌  | ✅      |

---

## Estructura de Carpetas

```
src/app/core/services/
├── auth/                    # AuthService, CredentialsService
├── exercises/              # ExercisesService
├── plans/
│   ├── plans.service.ts      # Service principal
│   ├── day-plan-state.service.ts
│   ├── api/
│   │   └── plans.api.ts
│   └── storage/
│       └── plans.storage.ts
├── routines/
│   ├── routines.service.ts  # Service principal
│   └── api/
│       └── routines.api.ts
├── trackings/
│   ├── plan-tracking.service.ts   # Fachada
│   ├── plan-tracking.domain.ts   # Domain
│   ├── plan-tracking.state.ts  # State
│   ├── tracking-list.state.ts    # Estado lista
│   ├── plan-tracking/
│   │   ├── api/
│   │   │   └── plan-tranking.api.ts
│   │   └── storage/
│   │       └── plan-tracking.storage.ts
├── user/                    # UserService
├── workouts/
│   ├── workout.state.ts      # Estado workout activo
│   └── api/
│       └── workout.api.ts
├── extra-session/
│   ├── extra-session.service.ts
│   └── api/
│       └── extra-session.api.ts
├── date.service.ts
└── warmup.service.ts
```
