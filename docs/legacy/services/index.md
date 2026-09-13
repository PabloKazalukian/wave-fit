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
        │ (GraphQL)│    │(IDB/local)│   │ (Signals)│
        └──────────┘    └──────────┘    └──────────┘
```

> Storage: usa **IndexedDB (Dexie)** (vía `IndexedDbStorageService`) además de `localStorage`, con cola de sync offline (`SyncQueueService`).

### Patrones según complejidad

| Complejidad | Patrón                           | Ejemplos                        |
| ----------- | -------------------------------- | ------------------------------- |
| **Alta**    | Domain + (API + Storage) + State | PlanTracking                    |
| **Media**   | API + Storage + State            | Plans, ExtraSession             |
| **Baja**    | API + Service (juntos)           | Exercises, Routines, User, Auth |

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

| Documento                                                  | Servicio                                      | Arquitectura                                                                            |
| ---------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------- |
| [AuthenticationAndApollo.md](./AuthenticationAndApollo.md) | AuthService, TokenStorage, CredentialsService | API + Service                                                                           |
| [ExercisesService.md](./ExercisesService.md)               | ExercisesService                              | API + Service (offline)                                                                 |
| [RoutinesService.md](./RoutinesService.md)                 | RoutinesService, RoutinesApiService           | API + Service (offline)                                                                 |
| [UserProfileService.md](./UserProfileService.md)           | UserProfileService, Domain, State             | Domain + API + State                                                                    |
| [WorkoutStateService.md](./WorkoutStateService.md)         | WorkoutStateService, WorkoutApi               | State + API                                                                             |
| [PlanTrackingService.md](./PlanTrackingService.md)         | PlanTrackingService, Domain, State            | Domain + API + Storage + State                                                          |
| [ExtraSessionService.md](./ExtraSessionService.md)         | ExtraSessionService                           | API + State                                                                             |
| [CoachService.md](./CoachService.md)                       | CoachService, CoachState, CoachStorage        | API + Service + State + Storage                                                         |
| [TrainingHistoryService]                                   | TrainingHistoryService (API + Service)        | Documentado en [TrainingHistoryComponent.md](../components/TrainingHistoryComponent.md) |

---

## Resumen de Servicios

### Servicios con Domain (Alta complejidad)

| Servicio     | Domain | API | Storage | State |
| ------------ | ------ | --- | ------- | ----- |
| PlanTracking | ✅     | ✅  | ✅      | ✅    |
| UserProfile  | ✅     | ✅  | ❌      | ✅    |

### Servicios con State (Media complejidad)

| Servicio     | API | Storage | State |
| ------------ | --- | ------- | ----- |
| Plans        | ✅  | ✅      | ✅    |
| DayPlan      | ❌  | ❌      | ✅    |
| TrackingList | ✅  | ✅      | ✅    |
| ExtraSession | ✅  | ❌      | ✅    |
| WorkoutState | ✅  | ❌      | ✅    |

> ⚠️ Correcciones: `ExtraSession` **NO tiene Storage**; `DayPlan` es puro **State** (delega a Plans/Routines).

### Servicios Simples (Baja complejidad)

| Servicio         | API | Service | Notas                              |
| ---------------- | --- | ------- | ---------------------------------- |
| Exercises        | ✅  | ✅      | + storage/offline (IndexedDB+Sync) |
| Coach            | ✅  | ✅      | + State + Storage (plan activo)    |
| Routines         | ✅  | ✅      | + storage/offline (IndexedDB+Sync) |
| Auth             | ✅  | ✅      |                                    |
| Credentials      | ❌  | ✅      |                                    |
| Date             | ❌  | ✅      |                                    |
| Warmup           | ❌  | ✅      |                                    |
| TrainingHistory  | ✅  | ✅      |                                    |
| Network          | ❌  | ✅      | infraestructura                    |
| SyncQueue        | ❌  | ✅      | infraestructura (offline)          |
| IndexedDbStorage | ❌  | ✅      | infraestructura (Dexie)            |

> ⚠️ `User` ya no existe (reemplazado por UserProfile).

---

## Estructura de Carpetas

```
src/app/core/services/
├── auth/                    # AuthService, CredentialsService
├── coach/                   # CoachService, CoachState, storage/coach.storage.ts
├── exercises/               # ExercisesService (+ offline)
├── plans/
│   ├── plans.service.ts      # Service principal
│   ├── day-plan-state.service.ts  # DayPlanState (State)
│   ├── api/
│   │   └── plans.api.ts
│   └── storage/
│       └── plans.storage.ts
├── routines/
│   ├── routines.service.ts  # Service principal (+ offline)
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
├── user/                    # UserProfileService + Domain + State + api/ (NO UserService)
├── workouts/
│   ├── workout.state.ts      # Estado workout activo
│   └── api/
│       └── workout.api.ts
├── extra-session/
│   ├── extra-session.service.ts
│   └── api/
│       └── extra-session.api.ts
├── training-history/         # TrainingHistoryService (calendario /user/history)
├── network/                  # network-status.service.ts
├── sync/                     # sync-queue.service.ts, sync.types.ts (offline)
├── storage/                  # indexed-db.service.ts (Dexie)
├── date.service.ts
└── warmup.service.ts
```
