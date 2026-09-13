# 🗓️ Plan de Implementación — Day Log (PlanDay)

> Documento de trabajo. `documents/plans/` está en **`.gitignore`** (no se versiona).
> Estado: **pendiente de ejecución**.
> Rama de trabajo: `feat/day-log`.

---

## 1. Contexto y Objetivo

Hoy la app solo permite el **week-log**: un `TrackingVM` contenedor de 7 días (`WeekLog`) que se registra como "semana activa" a través de `PlanTrackingService` (fachada `Domain + API + Storage + State`) y la página `/my-week`.

Se quiere añadir el **day-log**: registrar **un solo día de entrenamiento** como contenedor, con las **mismas reglas** que el week-log:

- Se le asocia un `WorkoutSession` y/o sesiones `ExtraSession`.
- Para **borrar** se borra desde el day-log (tanto el workout como las sesiones extra).
- Arquitectura de servicios espejo de week-log: **state + api + domain + storage**.
- El conjunto equivalente a `plan-tracking` se llamará **`plan-day`** (para el equivalente de `plan-tracking`).

Además:

- El usuario podrá elegir siempre entre **week-log** o **day-log** mediante un **select en `/my-week`**.
- El **valor predeterminado** lo da el campo `DistributionDays` del `UserProfile` en backend:
    ```ts
    export enum DistributionDays {
        WEEK = 'week_log',
        DAY = 'day_log',
    }
    ```
    El valor predeterminado **solo organiza la presentación inicial** (qué se muestra/crea por defecto), no bloquea al usuario a elegir el otro.
- Nueva página **`/my-day`** con las mismas capacidades que el week-log por debajo (manejo del workout + extra-session), reutilizando los componentes day-level existentes.
- Última tarea: **adaptar a PWA** (offline/sync), replicando/superando el nivel que tenga week-log.

> ✅ **Backend YA actualizado.** Existen las operaciones GraphQL `DayLog`, `ActiveTracking` (fuente de verdad con `type`), `CreateDayLog`, `UpdateDayLog`, `UpdateDayLogStatus`, `UpdateWorkoutSession` (WS global), assign/remove day-log e histórico. El contrato completo está en §5. El **day-log usa modelo flat** (no anida `days[]`): `workoutSessionId` + `exercises` + `extraSessionIds` + `status` a nivel de raíz.

---

## 2. Hallazgos del Código Actual (baseline)

### 2.1 Referencias a `DistributionDays` (frontend)

| Archivo                                                                        | Línea            | Contenido                                                                                                           |
| ------------------------------------------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| `src/app/shared/utils/profile.types.ts`                                        | 3, 276, 309, 332 | Tipo `DistributionDays = 'Week-log' \| 'Day-log'` + campos en `ProfileUserAPI`, `ProfileUser`, `UpdateProfileInput` |
| `src/app/shared/wrappers/profile.wrapper.ts`                                   | 140, 168         | Mapeo API→domain y por defecto `'Week-log'`                                                                         |
| `src/app/pages/user/profile/profile.ts`                                        | 85               | Form setup por defecto `'Week-log'`                                                                                 |
| `src/app/shared/components/widgets/users/profile/user-profile/user-profile.ts` | 75, 107, 158-159 | FormControl + default `'Week-log'`                                                                                  |
| `user-profile.html`                                                            | 21               | Select `distributionDaysControl`                                                                                    |
| `src/app/shared/pipes/translate-label.pipe.ts`                                 | 14               | Label `'Frecuencia de registro'`                                                                                    |

> ⚠️ **Desfase backend/frontend:** el backend usa `'week_log' | 'day_log'` (snake_case, minúscula); el frontend usa `'Week-log' | 'Day-log'` (con guion y mayúscula). Habrá que alinear/normalizar (ver §6.1).

### 2.2 Estado actual de `DistributionDays` en consumo

El valor ya existe en el modelo de perfil y en el formulario de perfil, pero **no se consume en ningún flujo de logging**. Es el punto de enganche natural **solo para el default** del selector de `/my-week`.

La query `USER_PROFILE_FIELDS` (en `user-profile.queries.ts`) **NO** incluye `distributionDays` hoy; el campo viaja por el wrapper desde el `ProfileUserAPI`. Verificar si el backend lo devuelve (si no, añadir el campo al fragment).

### 2.2b Fuente de verdad de arranque — `activeTracking`

**La primera consulta del flujo de inicio es `ActiveTracking`** (no "¿hay semana activa?" ni "¿hay día activo?" por separado). `ActiveTracking` devuelve `hasActive` y, si hay, `type` = `WEEK_LOG` | `DAY_LOG` con el contenedor correspondiente (`week` o `day`). Eso **determina qué cargar** (my-day o my-week). El `PlanTrackingService`/`PlanDayService` actuales hacen `findActiveWeekLog`/`findActiveDayLog` por separado → **migrar a `activeTracking` único** (ver §5.1, §6.2 y T9b).

### 2.3 Servicios week-log (a espejar)

```
core/services/trackings/
├── plan-tracking.service.ts        # Fachada
├── plan-tracking.domain.ts         # Lógica + offline/sync (handler 'UpdateWeekLogDay')
├── plan-tracking.state.ts          # Signals + BehaviorSubject + IndexedDB (idb.saveTracking)
├── tracking-list.state.ts          # Historial (no aplica directo a day-log a priori)
└── plan-tracking/
    ├── api/plan-tranking.api.ts    # GraphQL (⚠️ "tranking" typo heredado)
    └── storage/plan-tracking.storage.ts  # localStorage (lectura inicial comentada)
```

- Componentes day-level reutilizables: `TrackingWorkout*`, `WorkoutInProgress`, `WorkoutCompleteList`, `WorkoutEdition`, `WorkoutActionsMenu`, `WorkoutRoutineSelector`, `WorkoutDayStats`, `ExtraSessionContent/Form/Create`.
- `WorkoutStateService` (estado del día activo: `selectedDate`, `workoutSession`, `exercises`) **depende de `PlanTrackingService`** (`trackingSvc.trackingPlanVM$`, `getWorkout`, `setExercises`). → Punto crítico a abstraer en §6.7.

### 2.4 PWA (Workbox, no @angular/service-worker)

- **Sí está instalado/adaptado:** `workbox-build`, `workbox-precaching`, `workbox-routing`, `workbox-strategies`, `workbox-window`, `workbox-cli`; `workbox-config.js` (injectManifest); `src/sw.js` (precache + rutas + GraphQL/IndexedDB + Background Sync `sync-mutations`); `public/manifest.webmanifest`; registro condicional en `src/main.ts` (solo producción); `public/icons/*`.
- **Gap:** el doc `documents/pwa/pwa-plan-offline.md` marca `PlanTrackingService` como **"Solo online (storage local)"** — la infra de offline/sync existe (`SyncQueueService`, `NetworkStatusService`, `IndexedDbStorageService`) pero **el tracking aún no está 100% offline-first**. Para day-log replicaremos el nivel del week-log y, en la tarea PWA, se podrá unificar/mejorar la capa offline de ambos.

---

## 3. Modelo de Datos Propuesto

### 3.1 Modelo de dominio (VM)

> ⚠️ **Modelo corregido según backend.** A diferencia del week-log (`TrackingVM` con 7 `days`), el **day-log es un modelo plano** (no anida `days[]`): tiene un único `workoutSessionId` + `exercises` + `extraSessionIds` + `status` a nivel de raíz.

```typescript
// src/app/shared/interfaces/day-log.interface.ts  (nuevo)
interface DayLogVM {
    id: string;
    userId: string;
    date: LocalDate; // día del day-log
    planId?: string | null; // rutina/plan de origen (opcional)
    routineDayId?: string | null; // rutina asignada (crea WS inicial con ejercicios)
    workoutSessionId?: string; // UN solo workout (WS global, no anidado)
    exercises?: ExercisePerformanceVM[]; // ejercicios del day-log (raíz)
    extraSessionIds?: string[]; // ids de sesiones extra
    status: DayStatusVM; // 'pending' | 'complete' | 'skipped'
    active: boolean; // true si es el day-log activo
    completed: boolean;
    notes?: string; // opcional (espacio débil en backend)
}
```

> Se recomienda **reutilizar** `WorkoutSessionVM`, `ExercisePerformanceVM`, `ExtraSession`, `DayStatusVM` y los enums ya existentes para que los widgets day-level funcionen **sin cambios**, y reutilizar los wrappers `tracking.wrapper.ts` (API ⇄ VM, `apiDateToLocalDate`).

> **Bottom-up desde la API:** los payloads de retorno de `CreateDayLog` / `DayLog` allá en backend devuelven el objeto plano `{ id date planId routineDayId workoutSessionId exercises extraSessionIds status active completed notes }`. El wrapper de day-log mapea exactamente ese shape a `DayLogVM`.

### 3.2 Rama de datos

| Rama                         | Contenedor   | Elemento Activo (State)    |
| ---------------------------- | ------------ | -------------------------- |
| TEMPLATE                     | RoutinePlan  | RoutineDay                 |
| TRACKING week-log            | TrackingVM   | WorkoutSession (7 días)    |
| **TRACKING day-log (nuevo)** | **DayLogVM** | **WorkoutSession (1 día)** |

---

## 4. Arquitectura de Servicios — `PlanDay` (espejo de `PlanTracking`)

Nueva carpeta: **`src/app/core/services/day-logs/`** (o `trackings/day-log/` si se prefiere mantenerlo dentro de `trackings/`).

```
core/services/day-logs/
├── plan-day.service.ts            # Fachada (orquesta domain + state + storage)
├── plan-day.domain.ts             # Lógica de negocio + offline/sync
├── plan-day.state.ts              # Signals + BehaviorSubject + IndexedDB
└── plan-day/
    ├── api/plan-day.api.ts        # GraphQL (day-log)
    └── storage/plan-day.storage.ts  # localStorage / IndexedDB
```

### 4.1 `PlanDayStateService` (`plan-day.state.ts`)

Espejo de `PlanTrackingStateService`, pero con una sola fecha/`DayLogVM`.

| Signal / getter          | Tipo                                          | Descripción                      |
| ------------------------ | --------------------------------------------- | -------------------------------- |
| `dayLog$`                | `Observable<DayLogVM \| null>`                | Day-log activo (BehaviorSubject) |
| `dayLog`                 | `Signal<DayLogVM \| null>`                    | toSignal de `dayLog$`            |
| `loading`                | `signal<boolean>`                             | Carga genérica                   |
| `loadingDayLog`          | `signal<boolean>`                             | Carga del day-log activo         |
| `loadingWorkoutCreation` | `signal<{ date: LocalDate; state: boolean }>` | Creación de workout              |
| `loadingStatusWorkout`   | `signal<boolean>`                             | Cambio de estado                 |
| `error`                  | `signal<string \| null>`                      | Último error                     |
| `userId`                 | `signal<string>`                              | Usuario activo                   |

Métodos: `setDayLog`, `setLoading*`, `setError`, `updateDayLog(updater)`, `updateWorkout(updater)`, `getDayLog()`, `getDayLogValue()`.
**Persistencia:** cada set persiste a IndexedDB vía `IndexedDbStorageService` (nuevo `idb.saveDayLog`).

### 4.2 `PlanDayDomainService` (`plan-day.domain.ts`)

Mismo patrón que `PlanTrackingDomainService` (registra handler de sync `'UpdateDayLog'`).

| Método                                         | Descripción                                                                                                                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initActiveLog()`                              | Consulta la **fuente de verdad** (`api.getActiveTracking`): `hasActive` + `type` (`WEEK_LOG`/`DAY_LOG`) + `week`/`day`. Decide qué contenedor cargar en cada state |
| `initDayLog()`                                 | Consulta el day-log activo (`api.getActiveDayLog`)                                                                                                                 |
| `createDayLog(planId?, date?, routineDayId?)`  | Crea day-log del día (`date = todayLocalDate()` si no se pasa). Con `routineDayId` crea el WS inicial con ejercicios pospoblados                                   |
| `createWorkoutWithRoutine(routineDayId, date)` | Asigna rutina al day-log (`assignRoutineToDayLog`) → crea/actualiza WS con ejercicios                                                                              |
| `updateExercises(date, exercises)`             | Persiste ejercicios del **WS global** (`UpdateWorkoutSession` con `id=dayLog.workoutSessionId`); online→API, offline→SyncQueue (`'UpdateDayLog'`)                  |
| `updateExtraSession(form)`                     | Extra session del day-log (asociada al WS/día)                                                                                                                     |
| `removeExtraSession(id)`                       | Elimina sesión extra **desde el day-log** (`removeExtraSessionFromDayLog`)                                                                                         |
| `updateWorkoutSession(workout)`                | Edita el **WS global** (no hay mutation unificada day-log): `UpdateWorkoutSession` contra `dayLog.workoutSessionId`                                                |
| `removeWorkoutSession(id)`                     | Elimina el workout **desde el day-log** (`removeWorkoutSessionFromDayLog`)                                                                                         |
| `setRestDay(date, isRest)`                     | `UpdateDayLogStatus`: **rest** → elimina WS + `status=skipped`; **no-rest** → crea WS si no existe + `status=pending`                                              |
| `completeDayLog(complete)`                     | `UpdateDayLog` con `completed:true` → fuerza `active=false`; limpia state/storage                                                                                  |
| `createRoutineFromWorkout(title, exerciseIds)` | Crea rutina desde el workout y refresca `RoutinesService`                                                                                                          |
| `removeDayLog(id)`                             | `RemoveDayLog`; limpia state/storage si coincide                                                                                                                   |

> El `PlanDayDomainService` debería **compartir** con `PlanTrackingDomainService` la lógica de "cuál es el contenedor activo" vía `activeTracking` (o delegar en un service común de discriminación de modo).

### 4.3 `PlanDayService` (fachada, `plan-day.service.ts`)

Espejo de `PlanTrackingService`. Expone `dayLog`, `loading*`, `dayLogVM$` (alias de `dayLog$`).

- Efecto reactivo al usuario → `initActiveLog(user)` (y si `type==='DAY_LOG'` → `initDayLog`).
- `exercisesUpdate$` con `debounceTime(4000)` → `domain.updateExercises` (edición del WS global).
- Métodos: `createDayLog`, `reloadDayLog`, `createWorkoutWithRoutine`, `setExercises`, `setRestDay`, `updateExtraSession`, `removeExtraSession`, `updateWorkoutStatus`, `updateWorkoutSession`, `getWorkout`, `getExercises`, `setRemoveAllExercises`, `removeWorkoutSession`, `createRoutineFromWorkout`, `completeDayLog`, `removeDayLog`.

### 4.4 `PlanDayApi` (`plan-day/api/plan-day.api.ts`)

Operaciones GraphQL reales del backend (ver §5 para el contrato completo). Reutiliza los wrappers `tracking.wrapper.ts`.

| Método                                       | Query/Mutation                        | Notas                                                                     |
| -------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------- |
| `getActiveTracking()`                        | `ACTIVE_TRACKING`                     | Fuente de verdad (`hasActive` + `type` + `week`/`day`)                    |
| `getActiveDayLog()`                          | `ACTIVE_DAY_LOG`                      | `no-cache`; wrap a `DayLogVM`                                             |
| `createDayLog(payload)`                      | `CREATE_DAY_LOG`                      | devuelve day-log plano con `exercises`                                    |
| `updateDayLog(payload)`                      | `UPDATE_DAY_LOG`                      | cerrar/completar (`completed:true`)                                       |
| `updateWorkoutSession(workout)`              | `UPDATE_WORKOUT_SESSION`              | editar ejercicios/estado del **WS global** (id=`dayLog.workoutSessionId`) |
| `updateDayLogStatus(date, isRest)`           | `UPDATE_DAY_LOG_STATUS`               | rest/no-rest del day-log activo                                           |
| `assignRoutineToDayLog(routineDayId, date)`  | `ASSIGN_ROUTINE_TO_DAY_LOG`           | asigna rutina → WS con ejercicios                                         |
| `removeWorkoutSessionFromDayLog(wsId)`       | `REMOVE_WORKOUT_SESSION_FROM_DAY_LOG` | borra workout desde day-log                                               |
| `removeExtraSessionFromDayLog(extraId)`      | `REMOVE_EXTRA_SESSION_FROM_DAY_LOG`   | borra sesión extra desde day-log                                          |
| `createRoutineByWorkout(title, exerciseIds)` | `CREATE_ROUTINE_BY_WORKOUT`           | (reutilizable)                                                            |
| `findAllDayLogs(limit, offset)`              | `DAY_LOGS`                            | histórico day-log                                                         |
| `findDayLogById(id)`                         | `DAY_LOG`                             | detalle day-log                                                           |
| `removeDayLog(id)`                           | `REMOVE_DAY_LOG`                      | borra day-log                                                             |

> ⚠️ **`WorkoutApi.updateWorkoutSession`** actual exige `weekLogId`. Para day-log se usará la misma mutation `UpdateWorkoutSession`, pero apuntando al **`dayLog.workoutSessionId`** (WS global). Generalizar el parámetro (`weekLogId` → `container/workoutSessionId`) según convenga en T11.

### 4.5 `PlanDayStorage` (`plan-day/storage/plan-day.storage.ts`)

Espejo: `getDayLogStorage(userId)` / `setDayLogStorage(dayLog, userId)` / `removeDayLogStorage(userId)`. Persistencia activa recomendada vía IndexedDB en el State (igual que week-log).

---

## 5. Capa GraphQL — Contrato real del backend (actualizado)

> Esta sección refleja **las operaciones que ya existen en backend**. El frontend las define en las queries (nuevo `core/apollo/day-log.queries.ts` + ajustes en `tracking.queries.ts` para las variantes renombradas de week).

### 5.1 Estado inicial (fuente de verdad + default)

```graphql
# ¿Hay tracking activo y de qué tipo? (fuente de verdad para el flujo de inicio / modal)
query ActiveTracking {
  activeTracking {
    hasActive
    type          # "WEEK_LOG" | "DAY_LOG"
    week { id startDate endDate completed active }
    day { id date completed active status }
  }
}

# Distribución sugerida (DEFAULT no determinante) + contexto de perfil
query ProfileContext {
  userProfileContext {
    profile { id distributionDays }  # "week_log" | "day_log"
    goal { ... }
    schedule { ... }
    trainingPreferences { ... }
    healthConstraints { ... }
  }
}
```

> `activeTracking` es la **única** fuente para saber si hay algo activo y de qué tipo. `distributionDays` (de `ProfileContext`) solo define el **default** inicial del select, nunca bloquea al usuario.

### 5.2 Iniciar

```graphql
# SEMANA — crear week log (empieza active=true)
mutation CreateWeekLog($input: CreateWeekLogInput!) {
    createWeekLog(createWeekLogInput: $input) {
        id
        startDate
        endDate
        planId
        completed
        active
        days {
            order
            date
            isRest
            workoutSessionId
            exercises {
                exerciseId
                series
                sets {
                    reps
                    weights
                }
            }
            extraSessionIds
            status
        }
    }
}
# input: { startDate: "2026-08-31", endDate: "2026-09-06", timezone: "America/Argentina/Buenos_Aires", planId?, notes? }

# DÍA — crear day log (empieza active=true; con routineDayId crea WS inicial con ejercicios)
mutation CreateDayLog($input: CreateDayLogInput!) {
    createDayLog(createDayLogInput: $input) {
        id
        date
        planId
        routineDayId
        workoutSessionId
        exercises {
            exerciseId
            series
            sets {
                reps
                weights
            }
        }
        extraSessionIds
        status
        active
        completed
        notes
    }
}
# input: { date: "2026-08-31", timezone: "America/Argentina/Buenos_Aires", planId?, routineDayId?, notes? }
```

### 5.3 Terminar

```graphql
# DÍA: completed=true → fuerza active=false
mutation UpdateDayLog($input: UpdateDayLogInput!) {
    updateDayLog(input: $input) {
        id
        active
        completed
        notes
    }
}
# input: { id: "...", completed: true }

# SEMANA: completed=true → fuerza active=false
mutation UpdateWeekLog($input: UpdateWeekLogInput!) {
    updateWeekLog(input: $input) {
        id
        completed
        active
        notes
    }
}
# input: { id: "...", completed: true }
```

### 5.4 Leer el día/semana activos (deprecados en transición, pero disponibles)

```graphql
query ActiveDayLog {
    activeDayLog {
        hasActiveDay
        day {
            id
            date
            completed
            active
            status
            workoutSessionId
        }
    }
}
query ActiveWeekLog {
    activeWeekLog {
        hasActiveWeek
        week {
            id
            completed
            active
            days {
                order
                date
                isRest
                status
            }
        }
    }
}
```

> Para el flujo de inicio se prioriza `ActiveTracking` (fuente de verdad). `activeDayLog`/`activeWeekLog` quedan como lectura directa del contenedor activo según el modo ya resuelto.

### 5.5 Editar ejercicios del día

```graphql
# Week-log (unificada):
mutation UpdateWeekDay($input: UpdateWeekLogDayUnifiedInput!) {
    updateWeekDay(input: $input) {
        order
        date
        isRest
        workoutSessionId
        exercises {
            exerciseId
            series
            sets {
                reps
                weights
            }
        }
        extraSessionIds
        status
    }
}
# input: { id: "<weekLogId>", timezone?, days: [{
#   order: 1,
#   workoutSession: { id?, date, exercises: [{ exerciseId, series, sets: [{reps, weights}] }], status },
#   extraSession: { date, discipline, duration, intensityLevel, calories?, notes? },
#   status?, isRest?
# }] }

# Day-log (usa WS global — NO hay mutation unificada):
mutation UpdateWorkoutSession($input: UpdateWorkoutSessionInput!) {
    updateWorkoutSession(updateWorkoutSessionInput: $input) {
        id
        date
        exercises {
            exerciseId
            series
            sets {
                reps
                weights
            }
        }
        status
    }
}
# input: { id: "<dayLog.workoutSessionId>", date?, exercises?... }
```

> **Clave:** el day-log **no tiene una mutation unificada por día**; la edición de ejercicios/estado se hace sobre el **WS global** (`dayLog.workoutSessionId`) con `UpdateWorkoutSession`.

### 5.6 Estado / descanso del día

```graphql
# DÍA (operan sobre el day-log activo; rest elimina WS y pone status=skipped; no-rest crea WS si no existe y pone pending)
mutation UpdateDayLogStatus($date: String!, $isRest: Boolean!) {
    updateDayLogStatus(date: $date, isRest: $isRest) {
        id
        status
        workoutSessionId
        active
    }
}

# SEMANA
mutation UpdateWeekDayWorkoutStatus($input: UpdateDayWorkoutStatusInput!) {
    updateWeekDayWorkoutStatus(input: $input) {
        order
        date
        isRest
        status
        workoutSessionId
    }
}
# input: { date: "2026-08-31", isRest: bool }
```

### 5.7 Asignar rutina / quitar sesiones

```graphql
mutation AssignRoutineToDayLog($routineDayId: String!, $date: String!) {
    assignRoutineToDayLog(routineDayId: $routineDayId, date: $date) {
        id
        routineDayId
        workoutSessionId
        exercises {
            exerciseId
        }
    }
}
mutation AssignRoutineToWeekDay($routineDayId: String!, $date: String!) {
    assignRoutineToWeekDay(routineDayId: $routineDayId, date: $date) {
        order
        date
        workoutSessionId
        exercises {
            exerciseId
        }
    }
}

mutation RemoveWorkoutSessionFromDayLog($workoutSessionId: String!) {
    removeWorkoutSessionFromDayLog(workoutSessionId: $workoutSessionId) {
        id
        workoutSessionId
        status
    }
}
mutation RemoveExtraSessionFromDayLog($extraSessionId: String!) {
    removeExtraSessionFromDayLog(extraSessionId: $extraSessionId) {
        id
        extraSessionIds
    }
}
mutation RemoveWorkoutSessionFromWeekDay($workoutSessionId: String!) {
    removeWorkoutSessionFromWeekDay(workoutSessionId: $workoutSessionId) {
        order
        date
        workoutSessionId
    }
}
mutation RemoveExtraSessionFromWeekDay($date: String!, $extraSessionId: String!) {
    removeExtraSessionFromWeekDay(date: $date, extraSessionId: $extraSessionId) {
        order
        date
        extraSessionIds
    }
}
```

### 5.8 Histórico / CRUD

```graphql
query DayLogs($limit: Float, $offset: Float) {
    dayLogFindAll(limit: $limit, offset: $offset) {
        id
        date
        completed
        active
        status
    }
}
query DayLog($id: String!) {
    dayLogFindOne(id: $id) {
        id
        date
        exercises {
            exerciseId
        }
        status
        active
        completed
    }
}
mutation RemoveDayLog($id: String!) {
    removeDayLog(id: $id) {
        id
    }
}

query WeekLogs($limit: Int, $offset: Int) {
    findAll(limit: $limit, offset: $offset) {
        id
        startDate
        endDate
        completed
        active
    }
}
query WeekLog($id: String!) {
    findOne(id: $id) {
        id
        startDate
        endDate
        completed
        active
        days {
            order
            date
            status
            isRest
        }
    }
}
mutation RemoveWeekLog($id: String!) {
    removeWeekLog(id: $id) {
        id
    }
}
```

---

### 5.9 Nombres de constantes GraphQL (frontend) recomendados

Nuevo `core/apollo/day-log.queries.ts`:

| Constante                             | Operación                                   |
| ------------------------------------- | ------------------------------------------- |
| `ACTIVE_TRACKING`                     | `query ActiveTracking` (§5.1)               |
| `CREATE_DAY_LOG`                      | `mutation CreateDayLog`                     |
| `UPDATE_DAY_LOG`                      | `mutation UpdateDayLog`                     |
| `UPDATE_WORKOUT_SESSION`              | `mutation UpdateWorkoutSession` (WS global) |
| `UPDATE_DAY_LOG_STATUS`               | `mutation UpdateDayLogStatus`               |
| `ASSIGN_ROUTINE_TO_DAY_LOG`           | `mutation AssignRoutineToDayLog`            |
| `REMOVE_WORKOUT_SESSION_FROM_DAY_LOG` | `mutation RemoveWorkoutSessionFromDayLog`   |
| `REMOVE_EXTRA_SESSION_FROM_DAY_LOG`   | `mutation RemoveExtraSessionFromDayLog`     |
| `DAY_LOGS` / `FIND_DAY_LOG_BY_ID`     | `query DayLogs` / `query DayLog`            |
| `REMOVE_DAY_LOG`                      | `mutation RemoveDayLog`                     |

> ⚠️ **Renombrados en week**: `UpdateWeekDay` (antes `UpdateDay`/`updateDay`), `UpdateWeekDayWorkoutStatus` (antes `UpdateDayWorkoutStatus`), `AssignRoutineToWeekDay`, `RemoveWorkoutSessionFromWeekDay`, `RemoveExtraSessionFromWeekDay`. Verificar `tracking.queries.ts` actual y alinear los nombres.

> ⚠️ Coordinación: confirmar en `activeTracking` los campos mínimos de `week`/`day`, y que `ProfileContext` exponga `distributionDays` (hoy `USER_PROFILE_FIELDS` no lo incluye).

---

## 6. Frontend — UI y Flujo

### 6.1 Normalización de `DistributionDays`

**El backend usa `'week_log' | 'day_log'` (snake_case, minúscula, default `WEEK`).** El frontend hoy usa `'Week-log' | 'Day-log'` (con guion y mayúscula) — **desfasado**. La corrección: alinear el frontend al valor del backend (fuente de verdad de persistencia). Ya que `distributionDays` se guarda/lee del backend, lo más limpio es que el dominio y el form de perfil usen directamente los valores del backend:

```typescript
// shared/interfaces (o utils) — valores IDÉNTICOS al enum del backend
export enum DistributionDays {
    WEEK = 'week_log',
    DAY = 'day_log',
}

// Dominio interno de la UI (qué mostrar/crear)
export type LogMode = 'week' | 'day';

export function apiDistributionToLogMode(v: DistributionDays): LogMode {
    return v === DistributionDays.DAY ? 'day' : 'week';
}
```

Tareas asociadas:

- Cambiar `profile.types.ts` (`DistributionDays = 'Week-log' | 'Day-log'`) por el enum con valores `'week_log' | 'day_log'`.
- Actualizar el wrapper de perfil (`profile.wrapper.ts`) — hoy hardcodea `'Week-log'`.
- Actualizar default del form de perfil (`profile.ts`, `user-profile.ts`) → `DistributionDays.WEEK`.
- Verificar translate-label y el `<select>` del perfil (valores de option).

> El valor solo define el **default inicial** del selector de `/my-week`; **no determina** qué se carga si ya hay un tracking activo (eso lo decide `activeTracking`).

### 6.2 Estado de modo activo (select en `/my-week`)

Nuevo servicio ligero de UI (o state existente reutilizado): `LogModeStateService` o signals en la página.

```typescript
mode = signal<LogMode>('week');               // activo en la sesión
defaultMode = signal<LogMode>('week');        // derivado de distributionDays
setMode(mode: LogMode);                       // el usuario lo cambia siempre
```

- **Inicialización — `activeTracking` es la PRIMERA consulta (fuente de verdad):**
    1. Consultar **`ActiveTracking`** (única consulta de arranque; no se consulta semana ni día por separado).
    2. Si `hasActive === true` → `type` (`"WEEK_LOG"`/`"DAY_LOG"`) **determina qué se carga**: `WEEK_LOG` → cargar/my-week, `DAY_LOG` → cargar/my-day. `mode` se fija según `type`.
    3. Si `hasActive === false` → no hay nada activo; mostrar selector de modo con `defaultMode` desde `distributionDays` (no determinante) y permitir elegir.
- **Select:** componente en la cabecera de `/my-week` (semántico `<select>` con `aria-label="Modo de registro"`).
- Al cambiar `mode` → re-renderizar el modo correspondiente (week-log / day-log) y navegar a la vista adecuada.

### 6.3 Rutas

Nueva página **`/my-day`** (espejo de `/my-week`), protegida con `authGuard`.

```
src/app/pages/my-day/
├── my-day.ts
├── my-day.html
├── my-day.routes.ts       # /my-day + /my-day/success
└── success/               # (opcional, espejo del success del week-log)
```

Registro en `src/app/app.routes.ts`:

```typescript
{ path: 'my-day', loadChildren: () => import('./pages/my-day/my-day.routes').then((m) => m.MY_DAY_ROUTES), canActivate: [authGuard] },
```

### 6.4 Página `/my-day`

Espejo de `MyWeek`, pero consumiendo `PlanDayService` (señal `dayLog`) y el nuevo widget contenedor `TrackingDayComponent`.

- Si **no hay** day-log activo → 3 tarjetas CTA (Coach IA, Explorar planes, Comenzar entrenamiento).
- Si **hay** → renderiza el widget `TrackingDayComponent`.
- Estado de carga → skeleton.

### 6.5 Widget `TrackingDayComponent`

Espejo simplificado de `TrackingWeekComponent`, pero con **un solo día**:

```
TrackingDay (página /my-day)
  └─→ TrackingDayComponent
        ├─→ InfoCard (descripción)
        ├─→ WorkoutDayStats        (stats del día — carrusel)
        ├─→ TrackingWorkoutComponent   (workout del día — REUSAR igual que week-log)
        │     └─ [switch por status] (COMPLETE/EDITED/NOT_STARTED/REST) — widgets existentes
        │     └─ WorkoutActionsMenu → WorkoutRoutineSelector
        ├─→ ExtraSessionContent    (sesiones extra del día — REUSAR)
        └─→ Botón "Agregar actividad extra" → ExtraSessionForm (REUSAR)
```

- **No** se usa `NavigatorWeek` (no hay 7 días).
- **No** se usa `WeeklyStats` (semanal) → se puede reutilizar `WorkoutDayStats`.
- "Finalizar día" → `PlanDayService.completeDayLog(complete)` → redirige a `/my-day/success` (o `/my-week`).

Rutas de archivos (recomendación): `src/app/shared/components/widgets/tracking/tracking-day/`.

### 6.6 Borrado (regla day-log)

- **Workout:** `PlanDayService.removeWorkoutSession(wsId)` → `RemoveWorkoutSessionFromDayLog($workoutSessionId)` (borra desde el day-log; también `WorkoutActionsMenu` → "Eliminar entrenamiento").
- **Extra session:** `PlanDayService.removeExtraSession(extraId)` → `RemoveExtraSessionFromDayLog($extraSessionId)` (borra desde el day-log).
- **Day-log completo:** `PlanDayService.removeDayLog(id)` → `RemoveDayLog`.
- Coherente con "se borra desde day-log".

### 6.7 Desacoplar `WorkoutStateService` (crítico)

Hoy `WorkoutStateService` depende **solo** de `PlanTrackingService` (`trackingPlanVM$`, `getWorkout`, `setExercises`). Para que los widgets day-level funcionen en ambos modos hay dos opciones:

- **Opción A (recomendada, mínima):** crear un `DayWorkoutStateService` equivalente que dependa de `PlanDayService`, y que `TrackingDayComponent` lo provea localmente (no root). Los widgets day-level consumen `WorkoutStateService` vía inyección — habrá que parametrizar o duplicarlos si dependen de esta clase concreta.
- **Opción B:** definir una interfaz común `WorkoutStore` (getWorkout, setExercises, selectedDate, workoutSession) implementada por ambas fachadas, e inyectar por token según el modo. Más limpió pero más refactor.

> Decisión recomendada: **Opción A** para el primer corte (espejo), y evolucionar a **Opción B** si se duplica demasiado. Detalle a resolver en la implementación revisando los consumidores reales de `WorkoutStateService`.

---

## 7. Tareas de Implementación (orden sugerido)

### Fase 1 — Base de datos / tipos

- [ ] T1. Crear `shared/interfaces/day-log.interface.ts` con `DayLogVM` (**flat**: `workoutSessionId`, `exercises`, `extraSessionIds`, `status`, `active`).
- [ ] T2. Normalizar `DistributionDays` y crear adaptador `LogMode` (§6.1); alinear wrapper de perfil.
- [ ] T3. Wrappers `day-log` API ⇄ VM (reusando `tracking.wrapper.ts`, `apiDateToLocalDate`).

### Fase 2 — Capa GraphQL

- [ ] T4. Crear `core/apollo/day-log.queries.ts`: `ACTIVE_TRACKING`, `CREATE_DAY_LOG`, `UPDATE_DAY_LOG`, `UPDATE_WORKOUT_SESSION`, `UPDATE_DAY_LOG_STATUS`, `ASSIGN_ROUTINE_TO_DAY_LOG`, `REMOVE_WORKOUT_SESSION_FROM_DAY_LOG`, `REMOVE_EXTRA_SESSION_FROM_DAY_LOG`, `DAY_LOGS`, `DAY_LOG`, `REMOVE_DAY_LOG` (contrato real §5).
- [ ] T5. Alinear `tracking.queries.ts` con los nombres renombrados de week: `UpdateWeekDay`, `UpdateWeekDayWorkoutStatus`, `AssignRoutineToWeekDay`, `RemoveWorkoutSessionFromWeekDay`, `RemoveExtraSessionFromWeekDay`.
- [ ] T5b. Confirmar que `ProfileContext`/`USER_PROFILE_FIELDS` exponen `distributionDays` (hoy no está en el fragment).

### Fase 3 — Servicios `PlanDay`

- [ ] T6. `plan-day.state.ts` (+ `idb.saveDayLog` en `IndexedDbStorageService`).
- [ ] T7. `plan-day.storage.ts`.
- [ ] T8. `plan-day/api/plan-day.api.ts` (operaciones §4.4).
- [ ] T9. `plan-day.domain.ts` (handler sync `'UpdateDayLog'`, offline; edición de WS global; `initActiveLog` vía `activeTracking`).
- [ ] T9b. Crear servicio/API común de `activeTracking` (PRIMERA consulta, fuente de verdad) compartido entre week-log y day-log; según `type` decide cargar my-week o my-day y establece el `mode`.
- [ ] T10. `plan-day.service.ts` (fachada + effect usuario + debounce 4s).
- [ ] T11. Generalizar `WorkoutApi.updateWorkoutSession` para apuntar al WS global del day-log (hoy con `weekLogId`).

### Fase 4 — UI

- [ ] T12. `LogMode` state/select en `/my-week` + lectura de `DistributionDays`.
- [ ] T13. Página `/my-day` + rutas.
- [ ] T14. Widget `TrackingDayComponent` (+ skeleton).
- [ ] T15. Reutilizar widgets day-level (`TrackingWorkout*`, `ExtraSession*`) y resolver inyección de `WorkoutStateService` (§6.7).
- [ ] T16. Wiring de borrado desde day-log (§6.6).

### Fase 5 — PWA / Offline

- [ ] T17. Asegurar persistencia offline del day-log (IndexedDB + `SyncQueue` `'UpdateDayLog'` + Background Sync) al nivel del week-log.
- [ ] T18. Verificar precache/rutas de `/my-day` en `src/sw.js` (SPA navigation fallback ya cubre rutas → confirmar).

### Fase 6 — Cierre

- [ ] T19. Tests unitarios (espejo de `plan-tracking.spec` / componentes).
- [ ] T20. `npm run lint` y `npm run build`.
- [ ] T21. Actualizar docs (`AGENTS.md`, `CONTRACT.md`, `documents/services/index.md`, `MyWeekComponent.md`, nuevo `MyDayComponent.md` y `PlanDayService.md`).

---

## 8. Riesgos y Decisiones Abiertas

| #   | Riesgo / decisión                                                                                                                                       | Impacto                              | Resolución                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| 1   | **Backend ya tiene** operaciones `DayLog`, `ActiveTracking`, WS global. Verificar que el schema **real** coincide con §5 (nombres de variables, campos) | Desincronización API                 | Comparar §5 con el schema real; ajustar queries                        |
| 2   | `DistributionDays` desfasado: backend `week_log/day_log` vs frontend `Week-log/Day-log` (baseline §2.1)                                                 | Integración frágil                   | **Alinear frontend al enum del backend** `week_log/day_log` (§6.1, T2) |
| 3   | `WorkoutStateService` acoplado a `PlanTrackingService`                                                                                                  | Widgets day-level dependen de semana | Opción A/B §6.7                                                        |
| 4   | `WorkoutApi.updateWorkoutSession` exige `weekLogId`; day-log usa **WS global** (`dayLog.workoutSessionId`)                                              | No aplica directo                    | Generalizar parámetro T11                                              |
| 5   | `USER_PROFILE_FIELDS`/`ProfileContext` sin `distributionDays`                                                                                           | Select sin valor inicial correcto    | Ampliar query de perfil T5b                                            |
| 6   | `activeTracking` como nueva fuente de verdad — requiere migrar `PlanTrackingService` inicial                                                            | Semana y día deben convivir          | Adoptar `activeTracking` en ambos (T9b)                                |
| 7   | PWA: week-log aún no 100% offline-first                                                                                                                 | Nivel objetivo ambiguo               | Definir alcance en T17/T18                                             |

---

## 9. Definición de Listo (DoD)

- [ ] `activeTracking` es la fuente de verdad de "¿hay algo activo y de qué tipo?".
- [ ] `/my-week` tiene select week-log/day-log; predeterminado según `DistributionDays` (no determinante); el usuario puede cambiar libremente.
- [ ] `/my-day` crea y muestra un day-log (modelo **flat**: WS global + extra-sessions).
- [ ] Edición de ejercicios del day-log vía `UpdateWorkoutSession` (WS global).
- [ ] Borrado de workout (`RemoveWorkoutSessionFromDayLog`) y extra-session (`RemoveExtraSessionFromDayLog`) se hace desde el day-log.
- [ ] `PlanDayService` + `Domain` + `Api` + `State` + `Storage` implementados (espejo de `PlanTracking`).
- [ ] Offline/sync del day-log funcionando (PWA) al menos al nivel del week-log.
- [ ] `npm run lint` y `npm run build` sin errores; tests verdes.
- [ ] Documentación actualizada.

---

## Notas

- `documents/plans/` está en `.gitignore` (los cambios aquí no se versionan salvo acuerdo).
- Rama actual: `feat/day-log`.
- Este documento es la **planificación**; las tareas T1–T21 se ejecutarán en iteraciones posteriores.
- **Rev v2 (corrección):** se incorporó el **contrato real del backend** (operaciones `DayLog`, `ActiveTracking`, `CreateDayLog`, `UpdateDayLog`, `UpdateDayLogStatus`, `UpdateWorkoutSession` para WS global, assign/remove day-log, histórico `DayLogs`/`DayLog`/`RemoveDayLog`, y variantes renombradas de week). Ver §5. El day-log usa **modelo flat** (no anida `days[]`).

---

## 10. Estado de Sesión (cierre 2026-09-01)

### Fase 1 — Base de datos / tipos ✅ COMPLETA

- `shared/interfaces/day-log.interface.ts` (`DayLogVM` **flat**: `workoutSessionId`, `exercises`, `extraSessionIds`, `status`, `active`, `date`, `notes`...).
- `shared/interfaces/api/day-log-api.interface.ts`.
- `shared/utils/profile.types.ts`: enum `DistributionDays { WEEK='week_log', DAY='day_log' }`, tipo `LogMode = 'week'|'day'`, `distributionToLogMode()` (alineado al backend, §6.1).
- `shared/wrappers/day-log.wrapper.ts` (incluye `patchDayLog`).
- Wrapper/pipe de perfil actualizados a `week_log|day_log` (T2).

### Fase 2 — Capa GraphQL ✅ COMPLETA

- `core/apollo/day-log.queries.ts` (T4): `ACTIVE_TRACKING`, `CREATE_DAY_LOG`, `UPDATE_DAY_LOG`, `UPDATE_WORKOUT_SESSION`, `UPDATE_DAY_LOG_STATUS`, `ASSIGN_ROUTINE_TO_DAY_LOG`, `REMOVE_WORKOUT_SESSION_FROM_DAY_LOG`, `REMOVE_EXTRA_SESSION_FROM_DAY_LOG`, `DAY_LOGS`, `DAY_LOG`, `REMOVE_DAY_LOG`.
- Renombres week alineados en `tracking.queries.ts` + `plan-tranking.api.ts` (`UpdateWeekDay`, `UpdateWeekDayWorkoutStatus`, `AssignRoutineToWeekDay`, `RemoveWorkoutSessionFromWeekDay`, `RemoveExtraSessionFromWeekDay`).
- `USER_PROFILE_FIELDS` expone `distributionDays` (T5b ✅).

### Fase 3 — Servicios `PlanDay` ✅ COMPLETA

- `plan-day.state.ts`, `plan-day/storage/plan-day.storage.ts`, `plan-day/api/plan-day.api.ts` (devuelve **VMs** vía wrapper; T3 contract), `plan-day.domain.ts` (F3 sync + `initActiveLog`), `plan-day.service.ts` (fachada effect + debounce 4s en `setExercises`).
- IndexedDB tabla `dayLogs` (v4) + `saveDayLog()` (T6).
- `core/services/trackings/active-tracking.api.ts` (**T9b**): `ActiveTrackingApi` común; `activeTracking` = única consulta de arranque (fuente de verdad).

### Fase 4 — UI (Opción B elegida) ✅ PARCIAL

**F4a ✅**: `activation-selector.ts`+`.html` (select week/day, default desde `UserProfileService`, emite `modeChange`); `my-week.ts/.html` mode-aware (no-active: selector + cards por modo; day=2 cards, "Iniciar día" → `startDay()`); página `my-day` + rutas `/my-day` y `/my-day/success` + placeholder → luego `TrackingDayComponent`.

**F4b ✅ — Opción B (WorkoutStore por token)**:

- `core/services/workouts/workout-store.interface.ts`: interfaz `WorkoutStore` + `InjectionToken WORKOUT_STORE`. Acciones retornan `Observable<unknown>` (los widgets solo suscriben; semana devuelve `TrackingVM`, día `WorkoutSessionVM`).
- `workout.state.ts`: `WorkoutStateService implements WorkoutStore` (week store; `loading`, `loadingWorkoutCreation`, `loadingStatusWorkout` + acciones delegando a `PlanTrackingService`; cast `status as StatusWorkoutSessionEnum`).
- `core/services/workouts/day-workout.store.ts`: `DayWorkoutStore` (day store backed por `PlanDayService`; mapeo: `setRestDay(date,ws,status)`→`setRestDay(date,isRest)`; `updateWorkoutStatus`→COMPLETE→`'complete'`, REST→`'skipped'`, resto→`'pending'`; `removeWorkoutSession`→`removeWorkoutSession(id)`→boolean).
- Widgets refactorizados a inyectar el token: `tracking-workout.facade.ts`, `workout-in-progress.facade.ts`, `workout-actions-menu.ts`, `workout-routine-selector.ts`, `exercise-selector.ts`, `extra-session-form.ts`; `workout-edition.ts` (`facade.store`).
- Wiring: `tracking-week.ts` → `providers: [TrackingWeekFacade, { provide: WORKOUT_STORE, useExisting: WorkoutStateService }]`; `tracking-day.ts` → `{ provide: WORKOUT_STORE, useClass: DayWorkoutStore }`.
- `TrackingDayComponent` + `tracking-day.facade.ts` + `tracking-day.html` (InfoCard, header fecha, "Finalizar día", confirm dialog, `TrackingWorkoutComponent`, "Agregar actividad extra" dialog).
- `/my-day`: `my-day.ts` enlaza `TrackingDayComponent`; `my-day.html` renderiza el widget si `dayLog()` existe (skeleton en `loading()`), CTA "Iniciar día" → `createDayLog()` en caso contrario. `dateService` removido (lógica movida al widget).

> Relacionado con §6.7: se adoptó **Opción B** en lugar de Opción A.

### Fuera de alcance / pendiente

- **T11 (sesiones extra day-log, creación):** SIN mutation de creación en el contrato backend (solo `RemoveExtraSessionFromDayLog`, rename). `ExtraSessionService` es root y week-couplado (`inject(WorkoutStateService)` + `PlanTrackingService`), y un service root NO puede resolver un token per-modo → **el flujo de crear sesiones extra del day-log queda fuera de alcance**. Solo display vía `ExtraSessionContent` dentro de `TrackingWorkoutComponent`. Documentado como follow-up.
- **T16 (wiring de borrado day-log)**: parcial — `removeWorkoutSession` mapeado; falta verificar "Eliminar entrenamiento" (WorkoutActionsMenu) end-to-end y `removeExtraSession`.
- **T14/T17/T18/T19/T21**: skeleton/offline/tests/docs aún pendientes.

### Verificación (green)

- `npx tsc --noEmit` ✅
- `npx eslint` (archivos refactorizados + day component) ✅
- `npx ng build` ✅ (AOT templates + DI) — solo warning pre-existente de bundle budget (no error).

### Decisiones abiertas / riesgos

- Sesiones extra del day-log (creación) → requiere mutation backend + desacoplar `ExtraSessionService` (T11 follow-up).
- Garantizar que los widgets week-only (`TrackingWeekFacade`, `NavigatorWeek`, `TrackingActive`, `WeeklyStats`) sigan usando `WorkoutStateService`/`PlanTrackingService` directamente (NO se tocaron).
- Sí /my-day con tracking activo: `/my-week` sigue siendo base si NO hay tracking activo (select). Revisar antes de cada cambio si perjudica algún punto del flujo.
