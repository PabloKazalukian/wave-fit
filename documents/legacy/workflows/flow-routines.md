# Flow - Rutinas (Rama TEMPLATE)

## Propósito

Crear planes semanales de entrenamiento compuestos por días de rutina.

---

## Modelo de Datos

```
RoutinePlan (plan semanal)
  └── RoutineDay (día de rutina)
        └── Exercise (ejercicio de la biblioteca)
```

---

## Arquitectura

| Capa   | Servicio                         |
| ------ | -------------------------------- |
| Facade | `RoutineFacade`                  |
| Domain | `RoutineDomainService`           |
| State  | `RoutineCreationStateService`    |
| API    | `ApiService` + `ExerciseService` |

---

## Flujo de Creación

### 1. RoutinePlan (Plan Semanal)

- Crear plan con nombre, descripción, distribución semanal
- Gestionar colección de RoutineDays (lunes-domingo)

### 2. RoutineDay (Día de Rutina)

- Cada día puede ser `WORKOUT` o `REST`
- Contiene lista de ejercicios de la biblioteca
  -Tiene estado reactivo en `RoutineCreationStateService` (día activo en edición)

### 3. Exercise (Biblioteca)

- Datos base: nombre, descripción, categoría, usaPeso
- Se obtiene una vez y se cachea con BehaviorSubject en `ExerciseService`

---

## Analogía con Tracking

| Template                       | Tracking                           |
| ------------------------------ | ---------------------------------- |
| `RoutinePlan` (plan semanal)   | `Tracking` (semana de seguimiento) |
| `RoutineDay` (día en creación) | `Workout` (día en seguimiento)     |

---

## Referencia

- Interfaces: `CONTRACT.md`
- Domain Service: `core/domain/routine.domain.service.ts`
- State: `core/services/routines/routine-creation-state.service.ts`
- Wrappers: `shared/wrappers/plans.wrapper.ts`, `routines.wrapper.ts`
