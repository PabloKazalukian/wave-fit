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

| Documento                                                    | Descripción                                 |
| ------------------------------------------------------------ | ------------------------------------------- |
| [MyDayComponent.md](/documents/components/MyDayComponent.md) | Flujo de tracking con arquitectura completa |

### Plans

| Documento                                                                | Descripción                   |
| ------------------------------------------------------------------------ | ----------------------------- |
| [RoutinePlanComponent.md](/documents/components/RoutinePlanComponent.md) | Creación de rutinas semanales |

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

| Servicio | API | Storage | State |
| -------- | --- | ------- | ----- |
| Plans    | ✅  | ✅      | ✅    |
| DayPlan  | ❌  | ❌      | ✅    |
| Workouts | ❌  | ❌      | ✅    |

### Servicios Simples (Baja complejidad)

| Servicio    | API | Service |
| ----------- | --- | ------- |
| Exercises   | ✅  | ✅      |
| Routines    | ✅  | ✅      |
| User        | ✅  | ✅      |
| Auth        | ✅  | ✅      |
| Credentials | ❌  | ✅      |

---

## Estructura de Carpetas

```
src/app/core/services/
├── auth/                    # AuthService, CredentialsService
├── exercises/              # ExercisesService
├── plans/
│   ├── plans.service.ts    # Service principal
│   ├── day-plan-state.service.ts
│   ├── api/
│   │   └── plans-api.service.ts
│   └── storage/
│       └── plans-storage.service.ts
├── routines/
│   ├── routines.service.ts  # Service principal
│   └── api/
│       └── routines-api.service.ts
├── trackings/
│   ├── plan-tracking.service.ts        # Fachada
│   ├── plan-tracking-domain.service.ts # Lógica
│   ├── plan-tracking-state.service.ts # Estado
│   └── plan-tracking/
│       ├── api/
│       │   └── plan-tranking-api.service.ts
│       └── storage/
│           └── plan-tracking-storage.service.ts
├── user/                   # UserService
└── workouts/              # WorkoutStateService
```
