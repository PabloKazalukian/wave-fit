# 📝 Formulario Rutina Semanal — RoutinePlanForm

Documentación técnica del componente `RoutinePlanForm` y su jerarquía de subcomponentes para el flujo de creación de una rutina semanal.

---

## 🎨 Componentes — Jerarquía y Flujo

### Árbol de Componentes

```
RoutinePlanForm (Página Principal)
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
   → DayPlanService.initDayPlan(userId)
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
   → DayPlanService.changeDayPlanExpanded()
   → expanded = true para día 1
```

```
5. Usuario selecciona "WORKOUT" en día 1
   → WeekDayCellComponent emite evento
   → DayPlanService.setDay({ kind: 'WORKOUT' })
   → Muestra RoutineListBoxComponent
```

```
6. Usuario selecciona categoría "CHEST"
   → RoutineListBoxComponent busca rutina existente
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
   → PlansService.setRoutineDay(routine)
   → Busca día expandido en DayPlanService
   → Actualiza routineDays[index]
   → Sincroniza con DayPlanService
```

```
9. Usuario hace submit
   → RoutinePlanForm.onSubmit()
   → PlansService.submitPlan()
   → PlansApiService.createPlan()
```
