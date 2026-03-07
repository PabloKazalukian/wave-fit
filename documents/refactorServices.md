# Prompt para Refactorización - My-Day Services

---

## Contexto del Proyecto

- **Proyecto:** WaveFit (Angular 20 + TypeScript + TailwindCSS + Apollo GraphQL)
- **Ubicación:** `src/app/core/services/trackings/` y `src/app/core/services/workouts/`
- **Arquitectura destino:** Dumb → Facade → Domain → API/Storage/State

---

## Tarea Principal

Separar `PlanTrackingService` (actual monolith) en servicios con responsabilidad única según la arquitectura definida en AGENTS.md.

---

## Archivos Existentes (Solo Lectura)

```
core/services/trackings/
├── plan-tracking.service.ts        ← MONOLÍTICO (TARGET)
├── plan-tracking/
│   ├── api/
│   │   └── plan-tranking-api.service.ts    ← YA EXISTE (GraphQL)
│   └── storage/
│       └── plan-tracking-storage.service.ts ← YA EXISTE (localStorage)
└── workout-state.service.ts        ← RENOMBRAR A WorkoutFacade
```

---

## Step 1: Crear PlanTrackingStateService

**Archivo nuevo:** `src/app/core/services/trackings/plan-tracking-state.service.ts`

**Responsabilidad:** Administrar estado reactivo puro. Sin lógica de negocio, sin llamadas API.

**Propiedades (signals/observables):**
```typescript
// Estado central
private trackingSubject = new BehaviorSubject<TrackingVM | null>(null);
readonly tracking$ = this.trackingSubject.asObservable();
readonly tracking = toSignal(this.tracking$, { initialValue: null });

// Estado de UI
readonly loading = signal(false);
readonly loadingTracking = signal(false);
readonly error = signal<string | null>(null);
```

**Métodos (solo estado, sin lógica de negocio):**
```typescript
// Getters
getTracking(): TrackingVM | null
getTrackingValue(): TrackingVM | null  // sincrono

// Setters simples
setTracking(tracking: TrackingVM | null): void
setLoading(isLoading: boolean): void
setError(error: string | null): void

// Updaters (sin lógica, solo update del objeto)
updateTracking(updater: (t: TrackingVM) => TrackingVM): void
updateWorkout(date: Date, updater: (w: WorkoutSessionVM) => WorkoutSessionVM): void
```

---

## Step 2: Crear PlanTrackingDomainService

**Archivo nuevo:** `src/app/core/services/trackings/plan-tracking-domain.service.ts`

**Responsabilidad:** Toda la lógica de negocio. Orquestar API + State + Storage.

**Dependencias a inyectar:**
```typescript
private api = inject(PlanTrackingApi);
private state = inject(PlanTrackingStateService);
private storage = inject(PlanTrackingStorage);
private dateService = inject(DateService);
```

**Métodos (lógica de negocio compleja):**

| Método | Descripción |
|--------|-------------|
| `initTracking(userId: string)` | Carga inicial: cache → API → storage |
| `createTracking()` | Crea nuevo tracking semanal |
| `createWorkout(dateWorkout: Date)` | Crea sesión de entrenamiento |
| `toggleExercise(date: Date, exercise: ExercisePerformanceVM)` | Agrega/quita ejercicio |
| `removeExercise(date: Date, exerciseId: string)` | Elimina ejercicio |
| `setWorkouts(day: Date, workout: WorkoutSessionVM)` | Asigna workout al día |
| `setExercises(date: Date, exercises: ExercisePerformanceVM[])` | Asigna lista de ejercicios |
| `setRestDay(day: Date)` | Marca día como descanso |
| `completeTracking(complete: boolean)` | Completa la semana |
| `getWorkouts()` | Observable de workouts |
| `getExercises(workoutDate: Date)` | Observable de ejercicios de un día |
| `getWorkout(date: Date)` | Observable de workout por fecha |
| `getExercise(date: Date, exerciseId: string)` | Observable de ejercicio específico |

---

## Step 3: Reescribir PlanTrackingService

**Archivo:** `src/app/core/services/trackings/plan-tracking.service.ts`

**Responsabilidad:** Wrapper/Delegate público. Expone la API hacia las vistas sin lógica de negocio.

**Dependencias:**
```typescript
private domain = inject(PlanTrackingDomainService);
private state = inject(PlanTrackingStateService);
```

**Propiedades (delegadas):**
```typescript
readonly tracking$ = this.state.tracking$;
readonly tracking = this.state.tracking;
readonly loading = this.state.loading;
readonly loadingTracking = this.state.loadingTracking;
```

**Métodos (todos delegados al domain):**
```typescript
createTracking(): Observable<TrackingVM | null>
createWorkout(dateWorkout: Date): Observable<WorkoutSessionVM | null>
toggleExercise(date: Date, exercise: ExercisePerformanceVM): void
removeExercise(date: Date, exerciseId: string): void
setWorkouts(day: Date, workout: WorkoutSessionVM): void
setExercises(date: Date, exercises: ExercisePerformanceVM[]): void
setRestDay(day: Date): void
completeTracking(complete: boolean): Observable<any>
getWorkouts(): Observable<WorkoutSessionVM[]>
getExercises(workoutDate: Date): Observable<ExercisePerformanceVM[]>
getWorkout(date: Date): Observable<WorkoutSessionVM | undefined>
getExercise(date: Date, exerciseId: string): Observable<ExercisePerformanceVM | undefined>
```

**IMPORTANTE:** Eliminar del actual `PlanTrackingService`:
- ❌ Todo código de lógica de negocio
- ❌ Llamadas API directas
- ❌ Manipulación de storage
- ❌ Efectos (`effect()`)

---

## Step 4: Renombrar WorkoutStateService → WorkoutFacade

**Archivo:** `src/app/core/services/workouts/workout-state.service.ts`

**Nueva responsabilidad:** Facade para la vista de workout (estado de UI, no de datos).

**Dependencias:**
```typescript
private trackingService = inject(PlanTrackingService);  // ← delegate al service
```

**Propiedades (estado de UI):**
```typescript
// Solo estado de UI, NO duplicar datos del tracking
readonly selectedDate = signal<Date | null>(null);
readonly workout = signal<WorkoutSessionVM | null>(null);  // ← derivadas del tracking
readonly exercises = computed(() => this.workout()?.exercises ?? []);
```

**Métodos:**
```typescript
setDate(date: Date): void        // Cambia fecha seleccionada, carga workout
updateExercises(exercises: ExercisePerformanceVM[]): void  // Delega al service
loadWorkout(date: Date): void    // Carga workout desde service
```

**IMPORTANTE:** 
- ❌ NO debe tener efectos que subscriban internamente
- ❌ NO debe duplicar estado del tracking
- ✅ Derivar todo desde `PlanTrackingService`

---

## Step 5: Cleanup en PlanTrackingApi

**Archivo:** `src/app/core/services/trackings/plan-tracking/api/plan-tranking-api.service.ts`

**Cambios:**
- ❌ Eliminar `console.log` de debug (líneas 54, 70, 77, 87)
- ❌ Eliminar `console.log('transformado', workout)` (línea 70)
- ✅ Mejorar error handling (no retornar `of(null)` silenciosamente)

---

## Order de Implementación Sugerida

1. **Step 5** (Cleanup) - Sin riesgo, bajo acoplamiento
2. **Step 1** (StateService) - Base para los demás
3. **Step 2** (DomainService) - Lógica compleja
4. **Step 3** ( Reescribir Service) - Delegate
5. **Step 4** (WorkoutFacade) - Limpieza final

---

## Criterios de Éxito

- [ ] `PlanTrackingService` reduce su tamaño de ~257 líneas a ~60 líneas
- [ ] Cada servicio tiene una responsabilidad clara y documentable en una oración
- [ ] No hay lógica de negocio en servicios de estado
- [ ] No hay efectos con subscribe interno en WorkoutFacade
- [ ] No hay duplicación de estado entre WorkoutFacade y PlanTrackingService

---

## Pregunta de Clarificación

El método `userId = signal<string>('')` ¿debería mantenerse en algún servicio o moverse completamente al `AuthService`?

*(El `userId` actualmente se usa para cache y storage - debería vivir en StateService)*
