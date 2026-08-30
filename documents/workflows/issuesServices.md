# ISSUES SERVICIOS - FLUJO DE TRACKINGS

## ANALISIS

### ARQUITECTURA ESPERADA

```
SERVICE (Orquestador)
    ├── DOMAIN (Logica + API/Storage)
    │       ├── API (GraphQL)
    │       └── STORAGE (localStorage)
    └── STATE (Solo estado reactivo, NO API/Storage)
```

---

## FLUJO ACTUAL - CLASIFICACION DE FUNCIONES

### PLANTRACKINGSERVICE -> DESTINO

| # | Funcion | Destino | Tipo |API?|Storage?|State?|
|---|---------|--------|------|-----|--------|-------|
| 1 | createTracking | Domain | ✅ | ✅ | NO |
| 2 | createWorkout | Domain | ✅ | ✅ | NO |
| 3 | createWorkoutWithRoutine | Domain | ✅ | ✅ | NO |
| 4 | findAll | Domain | ✅ | ❌ | NO |
| 5 | findById | Domain | ✅ | ❌ | NO |
| 6 | removeExercise | Domain | STATE | ❌ | ✅ |
| 7 | setWorkouts | Domain | STATE | ❌ | ✅ |
| 8 | setExercises | Domain | STATE | ❌ | ✅ |
| 9 | setRestDay | Domain | ✅ | ✅ | ✅ |
| 10 | updateExtraSession | Domain | ✅ | ✅ | ✅ |
| 11 | removeExtraSession | Domain | ✅ | ✅ | ✅ |
| 12 | updateWorkoutStatus | Domain | STATE | ❌ | ✅ |
| 13 | updateWorkoutSession | Domain | ✅ | ✅ | ✅ |
| 14 | completeTracking | Domain | ✅ | ✅ | ❌ |
| 15 | getWorkouts | State | READ | ❌ | ❌ |
| 16 | getExercises | State | READ | ❌ | ❌ |
| 17 | getWorkout | State | READ | ❌ | ❌ |
| 18 | getExercise | State | READ | ❌ | ❌ |
| 19 | setRemoveAllExercises | Domain | STATE | ❌ | ✅ |
| 20 | removeWorkoutSession | Domain | ✅ | ✅ | ✅ |
| 21 | createRoutineFromWorkout | Domain | ✅ | ❌ | ❌ |

---

### PLANTRACKINGDOMAINSERVICE -> DESTINO FINAL

| # | Funcion | Final API | Final Storage | Notes |
|---|---------|----------|--------------|-------|
| 1 | createTracking | api.createTracking | ✅ (state + storage) | Crea nuevo week-log |
| 2 | createWorkout | api.updateTrackingDay | ✅ | Completa workout draft |
| 3 | createWorkoutWithRoutine | api.assignRoutineToDay | ✅ | Asigna routine-day |
| 4 | updateExtraSession | api.updateTrackingDay | ✅ | **PROBLEMA** |
| 5 | removeExtraSession | api.removeExtraSession | ✅ | **PROBLEMA** |
| 6 | removeExercise | NO API | ✅ | Solo local |
| 7 | setRemoveAllExercises | NO API | ✅ | Solo local |
| 8 | setWorkouts | NO API | ✅ | Solo local |
| 9 | setExercises | NO API | ✅ | Solo local |
| 10 | updateWorkoutStatus | NO API | ✅ | Solo local |
| 11 | updateWorkoutSession | workoutApi.updateWorkoutSession | ✅ | **Usa workoutApi** |
| 12 | removeWorkoutSession | api.removeWorkoutSession | ✅ | |
| 13 | setRestDay | api.updateTrackingDay | ✅ | |
| 14 | completeTracking | api.updateTracking | ✅ (remueve) | |
| 15 | findAllTrackingByUser | api.findAllTrackingByUser | NO | |
| 16 | findById | api.findById | NO | |
| 17 | createRoutineFromWorkout | api.createRoutineByWorkout | NO | Llama a routineService |

---

## PROBLEMAS IDENTIFICADOS

### PROBLEMA 1: ExtraSession usa week-log API en lugar de su propia API

Segun tu requerimiento: "si se hace un update de un ES o WS debe ser un update a sus respectivos api, porque se modifica por id"

**Caso actual:**
- updateExtraSession -> api.updateTrackingDay (week-log mutation)
- removeExtraSession -> api.removeExtraSession (week-log mutation)

**Deberia ser:**
- updateExtraSession -> extraSessionApi.update() o similar
- removeExtraSession -> extraSessionApi.remove() o similar

**Persiste en week-log solo para agregar/quitar IDs de la semana.**

---

### PROBLEMA 2: Storage gestionado en Domain (deberia estar en State o Service)

Segun tu description: "el problema radica en quien es que debe corregir la cache(storage), si state o domain, actualmente creo que esta en domain o service"

**Actual:**
- _updateWorkout() llama a this.state.updateWorkout() + luego this.storage.setTrackingStorage()
- _persist() llama a this.state.setTracking() + this.storage.setTrackingStorage()

**State NO conoce Storage, pero Domain si.**

```typescript
// Domain: line 413-418
private _updateWorkout(date: Date, updater: (w: WorkoutSessionVM) => WorkoutSessionVM) {
    this.state.updateWorkout(date, updater);  // State actualiza
    const updated = this.state.getTrackingValue();
    if (updated) {
        this.storage.setTrackingStorage(updated, this.state.userId());  // Domain guarda
    }
}
```

**Esto viola el principio de Separation of Concerns:**
- Domain hace logica + API
- State hace estado reactivo
- Storage deveria ser gestionado por Service, no Domain

---

### PROBLEMA 3: WorkoutSession usa workoutApi pero inconsistente

updateWorkoutSession (line 312-321) usa workoutApi.updateWorkoutSession() para actualizar el workout especifico, lo cual es correcto.

Pero no existe equivalente para ExtraSession - deveria usar extraSessionApi.

---

## RESUMEN DE ISSUE

| # | Funcion | Problema | Gravedad |
|---|---------|---------|----------|
| 1 | updateExtraSession | Usa week-log API en vez de extraSessionApi | ALTA |
| 2 | removeExtraSession | Usa week-log API en vez de extraSessionApi | ALTA |
| 3 | _updateWorkout() | Domain guarda en Storage (deberia ser State o Service) | MEDIA |
| 4 | _persist() | Domain guarda en Storage (deberia ser State o Service) | MEDIA |

---

## PREGUNTAS PARA CLARIFICAR

1. **El flujo esperado para ExtraSession es?**

   - Opcion A: Service -> Domain -> extraSessionApi (propia) -> week-log API (solo para sync IDs)
   - Opcion B: Service -> Domain -> week-log API (como esta ahora)

2. **Quien debe gestionar Storage?**

   - Opcion A: State (añadir metodo para persistir)
   - Opcion B: Service (orquestar Domain + Storage)
   - Opcion C: Domain (como esta - no recomendado)

3. **Confirmas que workoutApi esta bien usado para updateWorkoutSession?**