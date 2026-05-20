# WaveFit - Plan Offline-First (PWA)

## Arquitectura

```
                 ┌──────────────────────────────────────────────────┐
                 │                    UI Layer                     │
                 │  (Components → Facades → State Signals)         │
                 └──────────────────────┬───────────────────────────┘
                                        │
                                        ▼
                 ┌──────────────────────────────────────────────────┐
                 │              Domain Services                     │
                 │  ExercisesService / RoutinesService /           │
                 │  PlansService / PlanTrackingService              │
                 │                                                 │
                 │  1. Optimistic write → IndexedDB + Signal       │
                 │  2. Try API (si online) → actualiza IndexedDB    │
                 │  3. Si offline → encola PendingMutation          │
                 └──────────┬───────────────────┬───────────────────┘
                            │                   │
                            ▼                   ▼
                 ┌──────────────────┐  ┌──────────────────────┐
                 │   IndexedDB      │  │   SyncQueueService   │
                 │  (Local Source   │  │                      │
                 │   of Truth)      │  │  Procesa pendientes  │
                 │                  │  │  cuando hay conexión │
                 │  Stores:         │  │                      │
                 │  - exercises     │  │  Reintentos          │
                 │  - routines      │  │  Conflictos          │
                 │  - plans         │  │  Notifica UI         │
                 │  - tracking      │  └──────────┬───────────┘
                 │  - pendingMutations│           │
                 │  - graphqlCache  │            │
                 └──────────────────┘            │
                                                 ▼
                                      ┌──────────────────────┐
                                      │     API (Apollo)      │
                                      │  GraphQL mutations    │
                                      └──────────────────────┘
```

---

## 1. Principios

| Principio | Aplicación en WaveFit |
|-----------|----------------------|
| **Offline-first** | Escribir siempre primero en IndexedDB, luego sync |
| **Optimistic UI** | La UI responde instantáneo con datos locales, sin esperar API |
| **Eventual consistency** | Los datos se reconcilian con backend cuando hay conexión |
| **Background sync** | Cola de mutations se procesa automáticamente al reconectar |
| **Local-first state** | IndexedDB es la fuente de verdad local, Signals reflejan el estado |

---

## 2. Flujo Genérico (Create/Update/Delete)

```
USUARIO ACCIONA
      │
      ▼
┌─────────────────────────────────┐
│ 1. Generar ID local (ObjectId)  │
│ 2. Guardar en IndexedDB         │
│ 3. Actualizar Signal (UI ⚡)    │
└──────────┬──────────────────────┘
           │
           ▼
   ┌─── ¿Online? ───┐
   │                 │
   YES               NO
   │                 │
   ▼                 ▼
┌──────────┐  ┌──────────────────────┐
│ Ejecutar │  │ Guardar en           │
│ mutation │  │ pendingMutations     │
│ GraphQL  │  │ { id, operationName, │
│          │  │   variables, status, │
│ ┌──────┐ │  │   createdAt }        │
│ │ OK?  │ │  └──────────────────────┘
│ └──┬───┘ │
│   YES    NO         FIN (espera sync)
│   │     │
│   ▼     ▼
│ Sync  Reintentar
│ OK    (max 3)
│        │
│        ▼
│     Marcar failed
│     (intervención
│      manual)
└──────────────────┘
```

---

## 3. IndexedDB Schema

Versión actual (`WaveFitDB`, version 2):

```typescript
class WaveFitDB extends Dexie {
    // Cache de respuestas GraphQL para queries whitelisted
    graphqlCache!: Table<GraphqlCache, string>;
    // { cacheKey, data, updatedAt }

    // Cola de mutations pendientes de sync
    pendingMutations!: Table<PendingMutation, string>;
    // { id, operationName, variables, status, createdAt }

    // Sesión de usuario persistida
    authUser!: Table<AuthUser, string>;
    // { id, userId, name, email, role }
}
```

### Stores a agregar (version 3)

| Store | Key | Propósito |
|-------|-----|-----------|
| `exercises` | `id` | Cache local de ejercicios (ya existe parcialmente en graphqlCache) |
| `routines` | `id` | Cache local de rutinas diarias |
| `plans` | `id` | Cache local de planes semanales |
| `tracking` | `id` | Cache local de tracking activo |

---

## 4. Event Sourcing Simplificado

En vez de guardar snapshots completos, cada acción del usuario se modela como un **evento** en `pendingMutations`:

### Eventos de Tracking

```typescript
type MutationEvent =
    | { type: 'ADD_SET'; exerciseId: string; setIndex: number; reps: number; weight: number }
    | { type: 'REMOVE_SET'; exerciseId: string; setIndex: number }
    | { type: 'UPDATE_WEIGHT'; exerciseId: string; setIndex: number; weight: number }
    | { type: 'UPDATE_REPS'; exerciseId: string; setIndex: number; reps: number }
    | { type: 'FINISH_WORKOUT'; date: LocalDate }
    | { type: 'ADD_EXERCISE'; exerciseId: string }
    | { type: 'REMOVE_EXERCISE'; exerciseId: string }
```

### Eventos de Exercises

```typescript
type ExerciseEvent =
    | { type: 'CREATE_EXERCISE'; payload: Exercise }
    | { type: 'UPDATE_EXERCISE'; payload: Partial<Exercise> }
    | { type: 'DELETE_EXERCISE'; exerciseId: string }
```

### Eventos de Routines/Plans

```typescript
type RoutineEvent =
    | { type: 'CREATE_ROUTINE_DAY'; payload: RoutineDayCreate }
    | { type: 'UPDATE_ROUTINE_DAY'; id: string; payload: Partial<RoutineDay> }
    | { type: 'DELETE_ROUTINE_DAY'; id: string }

type PlanEvent =
    | { type: 'CREATE_PLAN'; payload: RoutinePlanSend }
    | { type: 'UPDATE_PLAN'; id: string; payload: Partial<RoutinePlanVM> }
```

Cada evento es **idempotente** (múltiples replays producen el mismo resultado final) y contiene **timestamp + version** para detectar conflictos.

---

## 5. SyncQueueService

Servicio central que procesa `pendingMutations` cuando hay conexión.

```typescript
@Injectable({ providedIn: 'root' })
export class SyncQueueService {
    private networkSvc = inject(NetworkStatusService);
    private idb = inject(IndexedDbStorageService);

    // Signal pública: número de mutations pendientes
    pendingCount = signal<number>(0);

    // Efecto: cuando se reconecta, procesa cola
    constructor() {
        effect(() => {
            if (this.networkSvc.isOnline()) {
                this.processQueue();
            }
        });
    }

    // Encolar una mutation
    async enqueue(mutation: PendingMutation): Promise<void> {
        await this.idb.db.pendingMutations.put(mutation);
        this.pendingCount.update(c => c + 1);
    }

    // Remover de la cola (éxito)
    async dequeue(id: string): Promise<void> {
        await this.idb.db.pendingMutations.delete(id);
        this.pendingCount.update(c => Math.max(0, c - 1));
    }

    // Procesar cola pendiente
    async processQueue(): Promise<void> {
        const pending = await this.idb.db.pendingMutations
            .where('status')
            .anyOf('pending', 'failed')
            .toArray();

        for (const mutation of pending) {
            await this.replay(mutation);
        }
    }

    // Reintentar una mutation específica
    async retryFailed(id: string): Promise<void> {
        const mutation = await this.idb.db.pendingMutations.get(id);
        if (mutation) await this.replay(mutation);
    }

    private async replay(mutation: PendingMutation): Promise<void> {
        await this.idb.db.pendingMutations.update(mutation.id, { status: 'syncing' });

        try {
            // Ejecutar la mutation GraphQL correspondiente
            const result = await this.executeMutation(mutation);

            if (result) {
                await this.dequeue(mutation.id);
                // Actualizar cache local con respuesta del server
                await this.reconcile(mutation, result);
            }
        } catch (error) {
            const record = await this.idb.db.pendingMutations.get(mutation.id);
            const retryCount = (record?.retryCount || 0) + 1;
            const maxRetries = 3;

            if (retryCount >= maxRetries) {
                await this.idb.db.pendingMutations.update(mutation.id, {
                    status: 'failed',
                    retryCount,
                });
                // Notificar UI para intervención manual
            } else {
                await this.idb.db.pendingMutations.update(mutation.id, {
                    status: 'pending',
                    retryCount,
                });
            }
        }
    }

    private async executeMutation(mutation: PendingMutation): Promise<any> {
        // Mapea operationName → mutation GraphQL y ejecuta
        switch (mutation.operationName) {
            case 'CreateExercise':
                // return apollo.mutate(...)
            case 'CreateRoutineDay':
                // ...
        }
    }

    private async reconcile(mutation: PendingMutation, serverResult: any): Promise<void> {
        // Actualizar IndexedDB + Signals con los IDs/valores reales del server
    }
}
```

### Mecanismo de Reconexión

El `NetworkStatusService` ya expone `isOnline()` como signal. `SyncQueueService` escucha cambios:

```
navigator.onLine = true
    → SyncQueueService.processQueue()
    → replaya todas las pendingMutations en orden FIFO
    → actualiza IndexedDB + Signals
    → UI se sincroniza automáticamente
```

---

## 6. Implementación por Servicio

### 6.1 ExercisesService (YA IMPLEMENTADO - REFERENCIA)

```typescript
createExercise(exercise: Exercise): Observable<Exercise> {
    // 1. Generar ID local
    const newId = this.generateObjectId();
    const exerciseWithId = { ...exercise, id: newId };

    if (this.networkSvc.isOnline()) {
        // 2. Intentar API
        return this.apollo.mutate(...).pipe(
            tap(res => this.updateLocalCache(res.data.createExercise))
        );
    } else {
        // 3. Offline: guardar local + encolar
        const pending = { id: newId, operationName: 'CreateExercise', ... };
        return from(this.saveOfflineMutation(pending, exerciseWithId));
    }
}
```

**Lo que falta**: Unificar con `SyncQueueService` en vez de escribir directo a `pendingMutations`.

### 6.2 RoutinesService (PENDIENTE)

Estado actual: llama directo a `this.apollo.mutate()`, sin offline.

```typescript
// Actual:
createRoutine(data: RoutineDayCreate): Observable<...> {
    return this.apollo.mutate(...)  // Solo online
}

// Objetivo:
createRoutine(data: RoutineDayCreate): Observable<RoutineDay> {
    const newId = this.generateObjectId();
    const withId = { ...data, id: newId };

    if (this.networkSvc.isOnline()) {
        return this.apollo.mutate(...).pipe(
            tap(res => this.updateLocalCache(res.data.createRoutineDay))
        );
    } else {
        const pending = { id: newId, operationName: 'CreateRoutineDay', ... };
        return from(this.saveOfflineMutation(pending, withId));
    }
}
```

### 6.3 PlansService (PENDIENTE)

Estado actual: `submitPlan()` llama a `planApi.createPlan()`, sin offline.

```typescript
// Objetivo:
submitPlan(plan: RoutinePlanSend): Observable<RoutinePlanVM> {
    const newId = this.generateObjectId();
    const withId = { ...plan, id: newId };

    if (this.networkSvc.isOnline()) {
        return this.planApi.createPlan(withId).pipe(
            tap(res => this.updateLocalCache(res))
        );
    } else {
        const pending = { id: newId, operationName: 'CreateRoutinePlan', ... };
        return from(this.saveOfflineMutation(pending, withId));
    }
}
```

### 6.4 PlanTrackingService (PENDIENTE)

Estado actual: actualiza signals + localStorage, pero depende de API para crear/finalizar.

**Eventos de tracking:**

| Acción | Evento | Sync |
|--------|--------|------|
| Agregar set | `ADD_SET` | Mutation parcial |
| Quitar set | `REMOVE_SET` | Mutation parcial |
| Cambiar peso | `UPDATE_WEIGHT` | Mutation parcial |
| Cambiar reps | `UPDATE_REPS` | Mutation parcial |
| Finalizar workout | `FINISH_WORKOUT` | Mutation completa |
| Agregar ejercicio | `ADD_EXERCISE` | Mutation parcial |
| Quitar ejercicio | `REMOVE_EXERCISE` | Mutation parcial |

**Estrategia de sync para tracking:**
- Cada evento individual se encola como `PendingMutation`
- Al reconectar, se replayan en orden cronológico
- Se usa `syncWeekLogDays` (mutation batch) → comentada actualmente en `plan-tranking.api.ts`

---

## 7. Servicio Web Worker / SW para Sync

El Service Worker (`src/sw.js`) actualmente solo cachea queries GraphQL (`GetExercises`, `Me`).

### Mejora propuesta

```javascript
// src/sw.js - Escuchar eventos de sync
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-mutations') {
        event.waitUntil(syncMutations());
    }
});
```

Usar la API **Background Sync** (cuando el browser lo soporte) para disparar sync incluso cuando la app no está abierta.

---

## 8. UI - Indicadores de Estado

| Componente | Estado | Señal |
|-----------|--------|-------|
| Banner offline | `!networkSvc.isOnline()` | Banner amarillo "Trabajando sin conexión" |
| Badge sync | `syncQueue.pendingCount > 0` | Contador + tooltip "X cambios pendientes" |
| Toast error sync | mutation status → `failed` | "Error al sincronizar. Toque para reintentar" |
| Spinner sync | mutation status → `syncing` | Indicador en header durante sync |

---

## 9. Implementación por Fases

### Fase 1 — SyncQueueService + IndexedDB v3

- Crear `SyncQueueService` con `enqueue()`, `dequeue()`, `processQueue()`
- Agregar stores `exercises`, `routines`, `plans`, `tracking` a `WaveFitDB` (version 3)
- `NetworkStatusService` → `SyncQueueService` escucha reconexión

### Fase 2 — Refactor ExercisesService

- Unificar `saveOfflineMutation()` para usar `SyncQueueService.enqueue()`
- Verificar que el flujo offline existente funcione con el nuevo sync

### Fase 3 — RoutinesService offline

- Agregar `generateObjectId()`
- Implementar `createRoutine()` offline-first
- Implementar `updateRoutine()` / `deleteRoutine()` offline

### Fase 4 — PlansService offline

- Implementar `submitPlan()` offline-first
- Implementar `updatePlan()` / `deletePlan()` offline

### Fase 5 — PlanTrackingService offline

- Modelar tracking events como `PendingMutation`
- Implementar sync batch con `syncWeekLogDays`
- Manejar conflictos en sets (por `version`)

### Fase 6 — Background Sync (SW)

- Registrar `sync` event en `sw.js`
- Disparar `SyncQueueService.processQueue()` desde SW

### Fase 7 — UI de estado

- Componente `OfflineBanner`
- Badge de mutations pendientes
- Toast de error sync + reintentar

---

## 10. Conflictos y Resolución

| Escenario | Estrategia |
|-----------|-----------|
| Misma entidad editada online y offline | **Server wins**: se descarta el cambio local si la versión del servidor es más reciente |
| Set de tracking modificado concurrentemente | **Merge por índice**: cada set tiene un `index` único, se mergean por posición |
| Ejercicio eliminado online que fue editado offline | **Soft delete**: marcar como `conflict` en UI, notificar al usuario |
| Mutation falla después de 3 reintentos | **Manual resolution**: marcar como `failed`, UI permite descartar o reintentar |

### Campos de Sync

```typescript
interface Syncable {
    id: string;
    version: number;          // Para optimistic locking
    updatedAt: string;        // ISO timestamp
    syncStatus: 'synced' | 'pending' | 'failed' | 'conflict';
    pendingSync: boolean;
}
```

---

## 11. Dependencias Existentes

```bash
# Ya instaladas
dexie@^4.4.2                # IndexedDB wrapper
workbox-precaching@^7.4.0   # SW precaching
workbox-routing@^7.4.0      # SW routing
workbox-strategies@^7.4.0   # SW caching strategies
workbox-window@^7.4.0        # SW lifecycle management

# No requiere instalación adicional
```

---

## 12. Diagrama de Sync

```
OFFLINE                          ONLINE (reconexión)
──────                          ───────────────────
User crea ejercicio             SyncQueueService detecta
      │                               isOnline = true
      ▼                               │
┌──────────────────┐                   ▼
│ 1. IndexedDB:    │             Procesar cola FIFO
│    exercises.add │                   │
│ 2. Signal.set()  │             ┌─────┴──────┐
│ 3. pendingMut.   │             │ Mutation 1 │
│    .put()        │             │ Mutation 2 │
└──────────────────┘             │ Mutation 3 │
        │                        └─────┬──────┘
        │                              │
     (espera)                    ┌─────┴──────┐
        │                       │ Replay each │
     Sigue usando               │ via Apollo  │
     la app offline              └─────┬──────┘
        │                              │
        │                        ┌─────┴──────┐
        │                       │ OK?         │
        │                       │    YES → dequeue + reconcile
        │                       │    NO  → retry (max 3)
        │                       │           → failed (manual)
        │                       └────────────┘
        │                              │
        ▼                              ▼
  UI actualizada                 UI sincronizada
  con datos locales              con datos server
```

---

## 13. Archivos a Modificar/Crear

### Nuevos archivos

```
src/app/core/services/sync/
├── sync-queue.service.ts       # Cola de mutations + replay
└── sync.types.ts               # Tipos de eventos de sync
```

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `indexed-db.service.ts` | Version 3: agregar stores `exercises`, `routines`, `plans`, `tracking` |
| `exercises.service.ts` | Usar `SyncQueueService.enqueue()` en vez de `idb.db.pendingMutations.put()` directo |
| `routines.service.ts` | Implementar offline-first (generar ID, IndexedDB, cola) |
| `plans.service.ts` | Implementar offline-first |
| `plan-tracking.service.ts` | Implementar eventos de tracking + sync batch |
| `plan-tranking.api.ts` | Descomentar/habilitar `syncWeekLogDays` |
| `src/sw.js` | Agregar listener `sync` para Background Sync API |
| `network-status.service.ts` | Ya funciona, verificar integración con SyncQueue |

---

## 14. Estado Actual vs Objetivo

| Servicio | Hoy | Objetivo |
|----------|-----|----------|
| ExercisesService | ✅ Offline parcial (crea, encola, pero sin sync) | Offline completo + sync automático |
| RoutinesService | ❌ Solo online | Offline-first + cola |
| PlansService | ❌ Solo online (storage local) | Offline-first + cola |
| PlanTrackingService | ❌ Solo online (storage local) | Offline-first + eventos + sync batch |
| SyncQueueService | ❌ No existe | Procesa cola al reconectar |
| Background Sync | ❌ No existe | Sync desde SW cuando vuelve la conexión |
| UI indicators | ❌ No existen | Banner + badge + toast |
