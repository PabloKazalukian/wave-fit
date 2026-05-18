# WaveFit - Plan de Offline-First (PWA)

## Estado Actual

- Apollo Angular con Observable pattern (no hooks)
- localStorage existe para Plans, Tracking, Auth (pero sin sync)
- Sin IndexedDB, sin cola offline, sin manejo de errores de red
- SW Workbox configurado en `src/sw.js` pero **no registrado**
- Angular `provideServiceWorker` en `app.config.ts` apunta a `ngsw-worker.js` pero está deshabilitado en `angular.json`

---

## Arquitectura Propuesta

```
Componentes
      │
      ▼
Facades (PlanTrackingFacade, RoutineFacade)
      │
      ▼
Domain Services (Business Logic)
      │                     │
┌─────┴──────────────────┐ │ │
Storage Layer            Sync Layer
(IndexedDB + Local)      (OfflineQueue)
└────────────────────────┘ │
      │                     │
┌─────┴──────┐    ┌────────┴─┐
API Services NetworkService
(Apollo)     (online detection)
```

---

## 1. Capa de Red - Network Detection

**Service**: `src/app/core/services/network/network-status.service.ts`

Detecta `navigator.onLine` + fallback con ping fetch. Expone `signal<boolean>` para estado online/offline y responde a eventos `online` / `offline` del navegador.

```typescript
@Injectable({ providedIn: 'root' })
export class NetworkStatusService {
    isOnline = signal<boolean>(navigator.onLine);
    // Eventos window online/offline
    // Método ping para fallback
}
```

---

## 2. Capa de Almacenamiento - IndexedDB

**Service**: `src/app/core/services/storage/indexed-db-storage.service.ts`

Reemplaza localStorage para datos grandes. Usa Dexie.js como wrapper.

**Stores requeridos**:

| Store              | Datos                                | Persistencia |
| ------------------ | ------------------------------------ | ------------ |
| `exercises`        | Lista de ejercicios                  | Infinita     |
| `routines`         | Rutinas diarias                      | Infinita     |
| `routinePlans`     | Planes semanales                     | Infinita     |
| `tracking`         | Seguimientos por semana              | Infinita     |
| `pendingMutations` | Cola de mutations offline            | Hasta sync   |
| `syncMeta`         | Metadata de sync (lastSync, version) | Infinita     |

**Migration**: Migrar `PlansStorage` y `PlanTrackingStorage` de localStorage → IndexedDB.

---

## 3. Modelo de Datos - Campos de Sync

Extender interfaces existentes con campos de sincronización:

**Archivo**: `src/app/shared/interfaces/syncable.interface.ts`

```typescript
export interface Syncable {
    id: string;
    localId?: string; // UUID generado offline
    pendingSync: boolean;
    syncStatus: SyncStatus;
    updatedAt: string; // ISO timestamp
    version: number; // Optimistic locking
}

export type SyncStatus = 'synced' | 'pending' | 'failed' | 'conflict';
```

**Aplicar a**:

- `Exercise` → `src/app/shared/interfaces/exercise.interface.ts`
- `RoutineDay`, `RoutinePlan` → `src/app/shared/interfaces/routines.interface.ts`
- `TrackingVM`, `WorkoutSessionVM` → `src/app/shared/interfaces/tracking.interface.ts`

---

## 4. Capa de Sync - Cola Offline

**Service**: `src/app/core/services/sync/sync-queue.service.ts`

Gestiona la cola de mutations pendientes.

**Archivo**: `src/app/shared/interfaces/pending-mutation.interface.ts`

```typescript
export interface PendingMutation {
    id: string;
    type: 'CREATE' | 'UPDATE' | 'DELETE';
    entity: 'exercise' | 'routine' | 'routinePlan' | 'tracking';
    payload: any;
    localId?: string; // ID local generado offline
    timestamp: string;
    retryCount: number;
    maxRetries: number;
    status: MutationStatus;
}

export type MutationStatus = 'pending' | 'syncing' | 'failed' | 'conflict';
```

**Flujo de sync**:

```
User Action → Domain Service
      │
      ▼
┌──────────────────────┐
│ isOnline?            │──No──→ Guardar en IndexedDB
│                      │           + agregar a cola SyncQueue
└──────────┬───────────┘           pendingSync: true
           │Yes
           ▼
    Ejecutar Mutation GraphQL
           │
      ┌────┴────┐
      │Success? │
      └────┬────┘
           │No              │Yes
           ▼                ▼
      Reintentar N veces   Marcar synced
           │                 + actualizar IndexedDB
      ┌────┴────┐            + quitar de cola
      │ Retry   │
      │Exceeded?│
      └───┬─────┘
          │Yes
          ▼
     Guardar en cola
     (syncStatus: 'failed')
```

**Métodos principales**:

- `enqueue(mutation: PendingMutation)`
- `processQueue()`
- `retryFailed()`
- `removeMutation(id: string)`
- `getPendingCount(): signal<number>`

---

## 5. Reestructuración de Servicios Existentes

### READ (listados) → NetworkFirst

```
ExercisesService, RoutinesService:
  query() → NetworkFirst
    ├── Online: fetch GraphQL → cache IndexedDB
    └── Offline: leer IndexedDB
```

### WRITE (crear/editar) → Offline Queue

```
ExercisesService, RoutinesService, PlanTrackingService:
  create() / update() / delete()
    ├── Online: ejecutar mutation → actualizar IndexedDB → quitar de cola
    └── Offline: guardar en IndexedDB + agregar a cola SyncQueue
```

### Tracking (sets/workouts)

Grabar sets localmente, sincronizar cuando haya conexión. Mismo patrón de cola.

### Extra Sessions

Mismo patrón de cola que tracking.

---

## 6. Conflict Resolution

Para tracking semanal (el más crítico):

- **Optimistic UI**: mostrar cambios inmediatamente
- **Server wins + merge**: si el server tiene datos más nuevos, mergear sets
- **Campo `version`**: detectar conflictos y notificar al usuario
- **Campo `syncStatus: 'conflict'`**: marcar items en conflicto

---

## 7. Service Worker - Workbox

**Archivo**: `src/sw.js` (ya existe, requiere registro correcto)

### Estrategias

| Tipo                 | Estrategia   | Motivo                        |
| -------------------- | ------------ | ----------------------------- |
| Assets (JS/CSS/HTML) | CacheFirst   | Inmutable post-build          |
| Imágenes             | CacheFirst   | Larga vida                    |
| Fuentes              | CacheFirst   | Inmutables                    |
| **GraphQL queries**  | NetworkFirst | Datos frescos, fallback cache |
| Navegación SPA       | NetworkFirst | Siempre intentar red          |

### Registro

Quitar `provideServiceWorker` de `app.config.ts` y registrar manualmente en `app.component.ts`:

```typescript
// app.component.ts
ngOnInit() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}
```

### Actualización de angular.json

Cambiar `"serviceWorker": false` a `"serviceWorker": "ngsw-worker.js"` en la configuración de producción, o mantener el registro manual de Workbox.

---

## 8. Archivos a Crear/Modificar

### Nuevos archivos

```
src/app/core/services/
├── network/
│   └── network-status.service.ts
├── storage/
│   └── indexed-db-storage.service.ts
└── sync/
    ├── sync-queue.service.ts
    └── sync.service.ts
```

```
src/app/shared/interfaces/
├── syncable.interface.ts
└── pending-mutation.interface.ts
```

```
documents/pwa/
└── pwa-plan.md (este archivo)
```

### Archivos a modificar

| Archivo                                                    | Cambio                                |
| ---------------------------------------------------------- | ------------------------------------- |
| `app.config.ts`                                            | Quitar `provideServiceWorker`         |
| `app.component.ts`                                         | Registrar SW manualmente              |
| `angular.json`                                             | Habilitar serviceWorker en producción |
| `src/sw.js`                                                | Mantener/ajustar estrategias Workbox  |
| `workbox-config.js`                                        | Verificar paths de build              |
| `src/app/shared/interfaces/exercise.interface.ts`          | Agregar campos Syncable               |
| `src/app/shared/interfaces/routines.interface.ts`          | Agregar campos Syncable               |
| `src/app/shared/interfaces/tracking.interface.ts`          | Agregar campos Syncable               |
| `src/app/core/services/exercises/exercises.service.ts`     | Agregar lógica NetworkFirst + offline |
| `src/app/core/services/routines/routines.service.ts`       | Agregar lógica NetworkFirst + offline |
| `src/app/core/services/plans/plans.service.ts`             | Migrar a IndexedDB                    |
| `src/app/core/services/trackings/plan-tracking.service.ts` | Migrar a IndexedDB + sync queue       |

### Interfaces GraphQL (backend, otro repo)

Requerirá mutations batching para sync efficient:

- `SYNC_EXERCISES` - batch de ejercicios creados/offline
- `SYNC_ROUTINES` - batch de rutinas
- `SYNC_TRACKING` - batch de tracking semanal

---

## 9. Dependencias a Instalar

```bash
npm install dexie
npm install -D @types/dexie  # optional
```

---

## 10. Orden de Implementación Sugerido

1. **Fase 1 - Base**: NetworkStatusService + IndexedDBStorageService
2. **Fase 2 - Core**: SyncQueueService con cola básica
3. **Fase 3 - Servicios**: Refactor ExercisesService y RoutinesService
4. **Fase 4 - Tracking**: Refactor PlanTrackingService con sync
5. **Fase 5 - SW**: Registrar y afinar Workbox
6. **Fase 6 - UI**: Indicadores visuales de sync/sin conexión
7. **Fase 7 - Conflictos**: Resolución de conflictos para tracking

---

## 11. UI - Indicadores de Estado

Agregar componentes de UI para feedback:

| Estado        | Indicador                                |
| ------------- | ---------------------------------------- |
| Offline       | Banner amarillo "Modo offline"           |
| Pending sync  | Badge con contador en header             |
| Sync failed   | Toast rojo con "Error de sincronización" |
| Syncing       | Spinner en header                        |
| Sync conflict | Modal de resolución                      |

Componente sugerido: `src/app/shared/components/offline-indicator/`
