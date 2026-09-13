# Analisis de Semantica - Estructura de Carpetas y Componentes

## Resumen Ejecutivo

La estructura del proyecto tiene una semantica **suficiente** para que un nuevo desarrollador entienda el flujo general, pero presenta fricciones que pueden misleadear. Los documentos en `/documents` son buenos pero tienen algunas discrepancias con el codigo real.

---

## Estructura General - Lo Bueno

### Division Tracking vs Template (Plans)

La division entre las dos ramas del modelo de datos es clara:

```
src/app/shared/components/widgets/
├── tracking/     ← Rama TRACKING (seguimiento semanal)
└── plans/        ← Rama TEMPLATE (creacion de rutinas)
```

Esta division refleja exactamente lo que dice AGENTS.md:

- **TEMPLATE**: RoutinePlan (plan semanal) > RoutineDay (rutina diaria)
- **TRACKING**: Tracking (semana) > WorkoutSession (dia)

### Jerarquia de Componentes

La anidacion permite entender el tree de componentes:

```
tracking/
├── tracking-week/           ← Vista semanal completa
│   ├── navigator-week/      ← Navegacion entre dias
│   ├── tracking-active/     ← Tracking activo
│   ├── card-extra-exercise/ ← Ejercicios extras
│   └── card-add-extra/      ← Agregar ejercicio extra
└── tracking-workout/        ← Contenedor de sesion diaria
    └── workout-in-progess/  ← Gestion de ejercicios activos
```

---

## Problemas Semanticos Identificados

### 1. Typo: WorkoutInProgess (EN LUGAR DE Progress)

**Ubicacion:**

```
src/app/shared/components/widgets/tracking/tracking-workout/workout-in-progess/
```

**Problema:** El nombre tiene "Progess" en lugar de "Progress".

**Impacto:** Un dev podria pensar que es un componente diferente o no encontrarlo al buscar "workout-in-progress".

---

### 2. Inconsistencia: Singular vs Plural en Exercises

**Carpeta padre:**

```
src/app/shared/components/widgets/exercises/
```

**Subcomponentes:**

- `exercise-selector/` (singular)
- `exercise-create/` (singular)
- `table/` (plural, sin prefijo)

**Problema:** Mezcla de singular y plural sin criterio claro.

---

### 3. Discrepancia: Documentos vs Codigo Real

**Documento MyDayComponent.md dice:**

```
TrackingWorkoutComponent
  ├─ ExerciseSelector
  └─ WorkoutInProgess
        └─ AccordionItemComponent (detalle de series, reps y peso)
```

**Realidad:**

- No existe `AccordionItemComponent` en la estructura
- `ExerciseSelector` esta en `widgets/exercises/`, no dentro de `tracking-workout/`

---

### 4. Typo en Archivo

**Ubicacion:**

```
src/app/shared/components/widgets/plans/weekly-routine-planner/days-routine-progress..ts
```

**Problema:** Doble punto en el nombre del archivo.

---

### 5. Facades Inconsistentes

**Con facade:**

- `tracking-workout/tracking-workout.facade.ts`
- `tracking-workout/workout-in-progess/workout-in-progress.facade.ts`
- `tracking-week/tracking-week.facade.ts`
- `plans/weekly-routine-planner/` (sin facade)
- `plans/routine-form/routine-form.facade.ts`

**Sin facade (pero probablemente deberian tener):**

- `exercises/exercise-selector/` (no tiene)
- `exercises/exercise-create/` (no tiene)
- `plans/week-day-cell/` (no tiene)
- `plans/day-of-routine/` (no tiene)

**Problema:** Un nuevo dev no sabe rapidamente donde esta la logica de presentacion.

---

### 6. Nombres de Servicios con Confusion

**Servicios encontrados:**

- `plan-tracking.service.ts` (Fachada)
- `plan-tracking.domain.ts` (Logica - notar que es .ts no .service.ts)
- `plan-tracking.state.ts` (Estado)
- `workout.state.ts` (Estado, pero en carpeta workouts/)

**Problema:**

- Algunos archivos usan sufijo `.service.ts`, otros no
- `plan-tracking.domain.ts` deberia ser `plan-tracking.domain.service.ts` por consistencia

---

## Estructura de Servicios - Comparacion Docs vs Real

### Segun documents/services/index.md

```
src/app/core/services/trackings/
├── plan-tracking.service.ts           # Fachada
├── plan-tracking-domain.service.ts    # Logica de negocio
├── plan-tracking-state.service.ts     # Estado reactivo
└── plan-tracking/
    ├── api/
    │   └── plan-tranking-api.service.ts
    └── storage/
        └── plan-tracking-storage.service.ts
```

### Realidad

```
src/app/core/services/trackings/
├── plan-tracking.service.ts    ← Fachada (OK)
├── plan-tracking.domain.ts     ← .ts, no .service.ts (INCONSISTENTE)
├── plan-tracking.state.ts      ← .ts, no .service.ts (INCONSISTENTE)
└── plan-tracking/
    ├── api/
    │   └── plan-tranking-api.service.ts  ← typo: "tranking" no "tracking"
    └── storage/
        └── (no existe - todo en un solo archivo?)
```

---

## Evaluacion por Capa

### Pages (Rutas)

| Pagina            | Nombre    | Semantica                               |
| ----------------- | --------- | --------------------------------------- |
| `/my-week`        | MyWeek    | Clara - semana del usuario              |
| `/trackings`      | Trackings | Clara - lista de trackings              |
| `/trackings/show` | Show      | Confusa - deberia ser "detail" o "view" |
| `/exercises`      | Exercises | Clara                                   |
| `/home`           | Home      | Clara                                   |

### Widgets (Componentes Reutilizables)

| Componente               | Semantica | Comentario             |
| ------------------------ | --------- | ---------------------- |
| `tracking-week`          | Clara     | Vista semanal          |
| `tracking-workout`       | Clara     | Vista de un dia        |
| `workout-in-progess`     | Confusa   | Typo en nombre         |
| `exercise-selector`      | Clara     | Selector de ejercicios |
| `exercise-create`        | Clara     | Crear ejercicio        |
| `weekly-routine-planner` | Clara     | Planificador semanal   |
| `week-day-cell`          | Clara     | Celda de un dia        |
| `day-of-routine`         | Clara     | Dia de rutina          |

### Services

| Servicio            | Nombre | Semantica             |
| ------------------- | ------ | --------------------- |
| PlanTrackingService | Clara  | Seguimiento de plan   |
| PlansService        | Clara  | Gestion de planes     |
| RoutinesService     | Clara  | Gestion de rutinas    |
| ExercisesService    | Clara  | Gestion de ejercicios |
| WorkoutStateService | Clara  | Estado del workout    |

---

## Recomendaciones

### Prioridad Alta (Corregir)

1. **Renombrar** `workout-in-progess/` → `workout-in-progress/`
2. **Corregir** typo en `plan-tranking-api.service.ts` → `plan-tracking-api.service.ts`
3. **Agregar** o **quitar** `AccordionItemComponent` de la documentacion
4. **Corregir** `days-routine-progress..ts` → `days-routine-progress.ts`

### Prioridad Media (Estandarizar)

1.统一命名: singular o plural en subcarpetas de `exercises/` 2.统一 sufijos: todos los archivos de servicio deben terminar en `.service.ts` 3.统一 ubicacion de facades: o todos en carpeta padre o todos junto al componente

### Prioridad Baja (Documentar)

1. Crear un `COMPONENTS.md` en la raiz que sea source of truth
2. Agregar un diagrama visual de la estructura de carpetas

---

## Conclusion

**Para un nuevo desarrollador:**

- Si lee los documentos de `/documents` primero: puede entender el flujo
- Si explora la estructura primero: puede confundirse con las inconsistencias

**La semantica es suficiente pero mejorable.** El nucleo de la arquitectura (tracking vs template, servicios por complejidad) esta bien planteado. Las mejoras propuestas son de pulido, no de rediseño.
