# 📝 Formulario Rutina Semanal — Plans

Documentación técnica del componente **Plans** (lista) y **Create** (creación) para el flujo de creación de una rutina semanal.

---

## 🎨 Componentes — Jerarquía y Flujo (actual)

### Árbol de Componentes

```
Plans (Página Lista) — src/app/pages/plans/
  └─→ Create (Página Creación)
        └─→ WeeklyRoutinePlannerComponent
              ├─→ DaysRoutineProgressComponent   (progreso semanal)
              ├─→ DayOfRoutineComponent          (cabecera: días + tipo REST/WORKOUT)
              └─→ WeekDayCellComponent           (celda del día)
                    └─→ RoutineFormComponent     (formulario de rutina + ejercicios)
                          └─→ (facade: routine-form.facade.ts)
```

> **Diferencias vs versiones anteriores:** ya **no existen** `RoutineListBoxComponent`, `RoutineExercisesComponent`, `RoutineExerciseFormComponent`, `ExerciseCreateComponent` ni `WeekDayCell→RoutineListBox`. Todo el form y selección de ejercicios vive ahora en **`RoutineFormComponent`** (con `RoutineFormFacade`). La jerarquía es plana dentro de `weekly-routine-planner` (progress + day-of-routine + week-day-cell conviven, no anidados).

---

## 🏗️ Arquitectura de Servicios

Plans usa **API + Storage + State**, con **soporte offline** (IndexedDB + SyncQueue):

```
PlansService (Service principal)
    │
    ├── PlansApiService        (GraphQL — plans/api/plans.api.ts)
    ├── PlansStorageService    (localStorage — plans/storage/plans.storage.ts)
    ├── IndexedDbStorageService (persistencia extra del plan)
    ├── NetworkStatusService / SyncQueueService (offline)
    │
    └── DayPlanStateService    (Estado de UI)

RoutineFormFacade              (coordina el form con RoutinesService/ExercisesService)
```

### PlansService (`plans.service.ts`)

- `routinePlanVM$` — Observable del plan activo (BehaviorSubject)
- `userId = signal('')`
- `initPlanForUser(userId)` — carga de Storage o crea plan vacío (7 días REST/expanded=0)
- `initRoutineDays()` — genera 7 `RoutineDayVM`
- `setRoutinePlan(plan)` — actualiza + persiste Storage (+ IndexedDB si tiene id)
- `setKindRoutineDay(dayIndex, kind)` — REST/WORKOUT
- `removeDayRoutine(dayToRemove)` — limpia el día
- `setDayRoutine(dayIndex, routine)` — asigna rutina al día
- `setDayRoutines(routineDays)` — reemplaza todos los días
- `setExpandedDay(dayIndex)` — día expandido
- `setWeeklyDistribution(distribution)`
- `createRoutinePlan(planInput)` — inyecta `createdBy`
- `getRoutinePlan()` / `getRoutinePlanById(id)` / `currentValue()`
- `submitPlan(current)` — online → API; offline → encola `CreateRoutinePlan` en SyncQueue + `generateObjectId()`
- `validateTitleUnique(title)` — valida nombre único
- `removePlan()` / `clearPlan()`
- `wrapperRoutinePlanVMtoRoutinePlan()` — VM → API

**Constructor:** registra el handler de sync `'CreateRoutinePlan'`.

### DayPlanStateService (`day-plan-state.service.ts`)

Estado de UI para la creación:

- `dayPlan` — Signal de los días
- `computedDayPlan()` — día seleccionado
- `setDay`, `setExpanded`, `changeExpanded`, `setKind`, etc. (selección de día, expansión, tipo)

> Coordina la vista con `PlansService`.

### PlansApiService / PlansStorageService

- **API:** `plans/api/plans.api.ts` — `createPlan`, `getRoutinePlanById`, `validateTitleUnique`
- **Storage:** `plans/storage/plans.storage.ts` — `getPlanStorage`, `setPlanStorage`, `removePlanStorage` (localStorage)

---

## 🔄 Flujo de Datos Completo

#### Escenario: Usuario Crea Plan Semanal

```
1. Usuario entra a /plans/create
   → Facade.initFacade() → PlansService.initPlanForUser(userId)
   → DayPlanStateService.initDayPlan(userId)
```

```
2. Usuario llena nombre/descripción/distribución
   → PlansService.setRoutinePlan() / setWeeklyDistribution()
   → PlansStorageService.setPlanStorage() (+ IndexedDB si tiene id)
```

```
3. Usuario selecciona día
   → DayOfRoutine/WeekDayCell → setExpandedDay() / setDay()
```

```
4. Usuario cambia tipo del día (REST/WORKOUT)
   → DayOfRoutine → setKindRoutineDay(dayIndex, kind)
```

```
5. En un día WORKOUT, WeekDayCell → RoutineFormComponent
   → RoutineFormFacade selecciona rutina/ejercicios
   → RoutinesService.getRoutinesByCategory() filtra
   → Si falta ejercicio: se crea desde exercises
```

```
6. Usuario guarda rutina del día
   → RoutinesService.createRoutine()
   → PlansService.setDayRoutine(dayIndex, routine)
   → Sincroniza con Storage/IndexedDB
```

```
7. Usuario hace submit
   → PlansService.submitPlan()
   → Online: PlansApiService.createPlan() + clearPlan()
   → Offline: encola 'CreateRoutinePlan' + clearPlan()
```

---

## 📁 Archivos Relacionados

```
src/app/core/services/plans/
├── plans.service.ts              # Lógica principal (+ offline)
├── day-plan-state.service.ts     # Estado de UI
├── api/
│   └── plans.api.ts              # GraphQL API (clase PlansApiService)
└── storage/
    └── plans.storage.ts          # localStorage (clase PlansStorageService)

src/app/core/services/routines/
├── routines.service.ts           # Servicio de rutinas (+ offline)
└── api/routines.api.ts

src/app/shared/components/widgets/plans/
├── weekly-routine-planner/
│   ├── weekly-routine-planner.ts
│   └── routine-days-progress/days-routine-progress.ts
├── day-of-routine/day-of-routine.ts
├── week-day-cell/week-day-cell.ts
└── routine-form/
    ├── routine-form.ts
    └── routine-form.facade.ts
```
