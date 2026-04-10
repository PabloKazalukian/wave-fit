# 📝 Formulario Rutina Semanal — Plans

Documentación técnica del componente `Plans` (lista) y `Create` (creación) para el flujo de creación de una rutina semanal.

---

## 🎨 Componentes — Jerarquía y Flujo

### Árbol de Componentes

```
Plans (Página Lista)
  │
  └─→ Create (Página Creación)
        │
        └─→ WeeklyRoutinePlannerComponent
              │
              ├─→ DaysRoutineProgressComponent (muestra progreso)
              │
              ├─→ DayOfRoutineComponent (muestra día individual)
              │
              └─→ WeekDayCellComponent (celda de día)
                    │
                    └─→ RoutineListBoxComponent
                          │
                          ├─→ RoutineExercisesComponent (acordeón de ejercicios)
                          │
                          └─→ RoutineExerciseFormComponent
                                │
                                └─→ ExerciseCreateComponent
```

---

## 🏗️ Arquitectura de Servicios

Plans utiliza la arquitectura **API + Storage + State** (sin Domain, no requiere lógica compleja):

```
PlansService (Service principal)
    │
    ├── PlansApiService (GraphQL API)
    │
    └── PlansStorageService (localStorage)

DayPlanStateService (Estado de UI)
    │
    ├── Signals para estado local (día seleccionado, etc.)
    └── Computed signals para derivadas
```

### Capas y Responsabilidades

| Capa        | Archivo                                  | Responsabilidad                                                       |
| ----------- | ---------------------------------------- | --------------------------------------------------------------------- |
| **Service** | `plans.service.ts`                       | Lógica principal, orquestación de API/Storage, estado BehaviorSubject |
| **API**     | `plans/api/plans-api.service.ts`         | Llamadas GraphQL al backend                                           |
| **Storage** | `plans/storage/plans-storage.service.ts` | Persistencia en localStorage                                          |
| **State**   | `day-plan-state.service.ts`              | Estado de UI (día expandido, categoría seleccionada)                  |

### PlansService

- `routinePlanVM$`: Observable del plan de rutina actual
- `initPlanForUser(userId)`: Inicializa plan desde Storage o crea nuevo
- `setRoutinePlan(plan)`: Actualiza plan y persiste en Storage
- `setExpandedDay(dayIndex)`: Controla qué día está expandido
- `setDayRoutine(dayIndex, routine)`: Asigna rutina a un día
- `submitPlan(current)`: Envía plan al backend vía PlansApiService
- `wrapperRoutinePlanVMtoRoutinePlan()`: Transforma VM a formato API

### DayPlanStateService

Estado de UI para la creación de rutinas:

- `routinePlan`: Signal del plan actual (desde PlansService)
- `indexDay`: Signal del índice del día seleccionado
- `routineDays`: Signal de rutinas disponibles
- `routinaDay`: Computed del día seleccionado
- `selectedCategory`: Computed de la categoría del día
- `routinesByCategory`: Computed de rutinas filtradas por categoría
- `expandedDays`: Computed de días expandidos
- `setDay(day)`: Selecciona un día
- `setKind(kind)`: Cambia entre REST/WORKOUT

### PlansStorageService

Persistencia en localStorage:

- `getPlanStorage(id)`: Recupera plan del usuario
- `setPlanStorage(plan, id)`: Guarda plan del usuario
- `removePlanStorage(id)`: Elimina plan del usuario

---

### 🔄 Flujo de Datos Completo

#### Escenario: Usuario Crea Plan Semanal

```
1. Usuario entra a /routines/create
   → RoutinePlanForm.ngOnInit()
   → Facade.initFacade()
```

```
2. Facade obtiene userId
   → PlansService.initPlanForUser(userId)
   → DayPlanStateService.initDayPlan(userId)
   → Carga desde Storage o crea vacío
```

```
3. Usuario llena nombre/descripción/distribución
   → FormGroup.valueChanges
   → PlansService.setRoutinePlan()
   → PlansStorageService.setPlanStorage()
```

```
4. Usuario selecciona día 1
   → DayPlanStateService.setDay(1)
   → DayPlanStateService.expandedDays actualiza
```

```
5. Usuario selecciona "WORKOUT" en día 1
   → WeekDayCellComponent emite evento
   → DayPlanStateService.setKind('WORKOUT')
   → Muestra RoutineListBoxComponent
```

```
6. Usuario selecciona categoría "CHEST"
   → RoutineListBoxComponent busca rutina existente
   → DayPlanStateService.routinesByCategory filtra
   → Si existe: muestra acordeón con ejercicios
   → Si no: muestra "No hay rutina"
```

```
7. Usuario crea nueva rutina
   → RoutineExerciseFormComponent se muestra
   → Usuario llena form y selecciona ejercicios
   → Si falta ejercicio: ExerciseCreateComponent
```

```
8. Usuario guarda rutina
   → RoutinesServices.createRoutine(routine)
   → PlansService.setDayRoutine(dayIndex, routine)
   → Busca día en PlansService
   → Actualiza routineDays[index]
   → Sincroniza con PlansStorageService
```

```
9. Usuario hace submit
   → RoutinePlanForm.onSubmit()
   → PlansService.submitPlan()
   → PlansApiService.createPlan()
```

---

## 📁 Archivos Relacionados

```
src/app/core/services/plans/
├── plans.service.ts                  # Lógica principal
├── day-plan-state.service.ts         # Estado de UI
├── api/
│   └── plans-api.service.ts          # GraphQL API
└── storage/
    └── plans-storage.service.ts       # localStorage

src/app/core/services/routines/
├── routines.service.ts               # Servicio de rutinas
└── api/
    └── routines-api.service.ts       # GraphQL API
```
