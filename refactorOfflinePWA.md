# Refactor Offline-First para PWA - WaveFit

## Objetivo

Implementar arquitectura **Offline-First** (Cache-First) para que la aplicación funcione sin conexión a internet, utilizando **IndexedDB** como almacenamiento local persistente.

---

## Problema Actual

| Servicio | localStorage | Memoria | ¿Sobrevive cierre? |
|----------|-------------|---------|---------------------|
| PlansService | ✅ SÍ | BehaviorSubject | ✅ SÍ |
| RoutinesService | ❌ NO | BehaviorSubject | ❌ NO |
| ExercisesService | ❌ NO | Signal | ❌ NO |

---

## Patrón Offline-First

```
1. Leer cache local primero (IndexedDB)
2. Si existe → usar datos locales
3. Si no existe → llamar API
4. Guardar respuesta en cache local
5. Sincronizar en background cuando haya internet
```

---

## Fase 1: Capa de Almacenamiento

### IndexedDB Wrapper

Crear servicio genérico para manejar IndexedDB:

```
src/app/core/services/storage/indexed-db.service.ts
```

**Responsabilidades:**
- Abrir/borrar base de datos
- CRUD genérico para cualquier entidad
- Soporte para transacciones
- Manejo de errores

**API propuesta:**

```typescript
interface StorageService {
  get<T>(store: string, id: string): Promise<T | null>;
  getAll<T>(store: string): Promise<T[]>;
  put<T>(store: string, item: T): Promise<void>;
  delete(store: string, id: string): Promise<void>;
  clear(store: string): Promise<void>;
}
```

### Cola de Sincronización

```
src/app/core/services/storage/sync-queue.service.ts
```

**Responsabilidades:**
- Guardar operaciones fallidas (mutations)
- Reintentar cuando haya conexión
- Marcar como "pending sync"

**Estructura:**

```typescript
interface SyncQueueItem {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'exercise' | 'routine' | 'plan';
  payload: any;
  timestamp: number;
  retries: number;
}
```

---

## Fase 2: Refactor de Servicios

### ExercisesService

**Ubicación:** `src/app/core/services/exercises/exercises.service.ts`

**Cambios:**

1. Inyectar `StorageService`
2. Cambiar `signal<Exercise[]>` por lectura de IndexedDB
3. Implementar cache-first:

```typescript
@Injectable({ providedIn: 'root' })
export class ExercisesService {
  private readonly storage = inject(StorageService);
  private readonly apollo = inject(Apollo);

  // GET con cache-first
  async getExercises(): Promise<Observable<Exercise[]>> {
    // 1. Leer de cache local
    const cached = await this.storage.getAll<Exercise>('exercises');
    if (cached.length > 0) {
      // Retornar cache inmediatamente + actualizar en background
      this.refreshFromAPI();
      return of(cached);
    }

    // 2. Si no hay cache, llamar API
    return this.fetchFromAPI();
  }

  // CREATE - guardar local + cola sync
  createExercise(exercise: Exercise): Observable<Exercise> {
    // 1. Guardar en cache local inmediatamente
    const tempId = generateTempId();
    const localExercise = { ...exercise, id: tempId, _pending: true };
    this.storage.put('exercises', localExercise);

    // 2. Agregar a cola de sync
    this.syncQueue.add({
      type: 'CREATE',
      entity: 'exercise',
      payload: exercise,
    });

    // 3. Intentar API
    return this.apollo.mutate(...).pipe(
      map(response => {
        // 4. Reemplazar ID temp con real
        const realExercise = response.data.createExercise;
        this.storage.delete('exercises', tempId);
        this.storage.put('exercises', realExercise);
        this.syncQueue.remove(tempId);
        return realExercise;
      }),
      catchError(error => {
        // Mantener en cola para retry
        return throwError(() => error);
      })
    );
  }

  private refreshFromAPI() {
    this.fetchFromAPI().subscribe(data => {
      this.storage.clear('exercises');
      data.forEach(ex => this.storage.put('exercises', ex));
    });
  }
}
```

### RoutinesService

**Ubicación:** `src/app/core/services/routines/routines.service.ts`

**Mismos cambios que ExercisesService:**

- BehaviorSubject → IndexedDB
- Cache-first en getAllRoutines()
- Cola de sync en createRoutine()
- Soporte para IDs temporales

### PlansService

**Revisar implementación actual:**

- Ya tiene `PlansStorageService` con localStorage
- Migrar a IndexedDB para mejor rendimiento
- Agregar cola de sync para submitPlan()

---

## Fase 3: Service Worker

### Angular Service Worker

La app ya tiene `@angular/service-worker` instalado. Configurar:

```
ngsw-config.json
```

**Configuración:**

```json
{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/assets/**",
          "/*.(svg|cur|jpg|jpeg|png|apng|webp|avif|gif|otf|ttf|woff|woff2)"
        ]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "api-freshness",
      "urls": ["/graphql"],
      "cacheConfig": {
        "strategy": "freshness",
        "maxSize": 100,
        "maxAge": "1h",
        "timeout": "5s"
      }
    },
    {
      "name": "api-performance",
      "urls": ["/graphql"],
      "cacheConfig": {
        "strategy": "performance",
        "maxSize": 500,
        "maxAge": "1d"
      }
    }
  ]
}
```

---

## Fase 4: Detección de Conexión

### Network Status Service

```
src/app/core/services/network.service.ts
```

```typescript
@Injectable({ providedIn: 'root' })
export class NetworkService {
  online$ = fromEvent(window, 'online').pipe(startWith(navigator.onLine));
  offline$ = fromEvent(window, 'offline').pipe(startWith(!navigator.onLine));

  isOnline(): boolean {
    return navigator.onLine;
  }
}
```

---

## Fase 5: Sincronización Automática

### Background Sync

```typescript
// sync-handler.service.ts
@Injectable({ providedIn: 'root' })
export class SyncHandlerService {
  private syncQueue = inject(SyncQueueService);

  async handleOnline() {
    const pendingItems = await this.syncQueue.getAll();

    for (const item of pendingItems) {
      try {
        await this.retryOperation(item);
        await this.syncQueue.remove(item.id);
      } catch (error) {
        if (item.retries >= MAX_RETRIES) {
          await this.handlePermanentFailure(item);
        } else {
          await this.syncQueue.incrementRetry(item.id);
        }
      }
    }
  }

  private async retryOperation(item: SyncQueueItem): Promise<void> {
    switch (item.entity) {
      case 'exercise':
        return this.exercisesService.createExercise(item.payload).toPromise();
      case 'routine':
        return this.routinesService.createRoutine(item.payload).toPromise();
      case 'plan':
        return this.plansService.submitPlan(item.payload).toPromise();
    }
  }
}
```

---

## Fase 6: UI para Estado Offline

### Indicador Visual

Crear componente que muestre estado de conexión:

```typescript
// connection-indicator.component.ts
@Component({
  selector: 'app-connection-indicator',
  template: `
    @if (isOffline()) {
      <div class="offline-banner">
        ⚠️ Sin conexión - Los cambios se sincronizarán cuando vuelvas
      </div>
    }
  `
})
export class ConnectionIndicator {
  network = inject(NetworkService);
  isOffline = toSignal(this.network.offline$);
}
```

### Deshabilitar Acciones Críticas

```typescript
// En componentes
canCreate(): boolean {
  return this.network.isOnline() || this.hasLocalData();
}
```

---

## Requisitos del Backend

Para soportar operaciones offline-first, el backend debe implementar:

### 1. Operaciones Idempotentes

Las operaciones deben poder ejecutarse múltiples veces sin efectos secundarios:

```graphql
# Mutation con idempotency key
mutation CreateExercise(
  $input: CreateExerciseInput!,
  $clientId: String!  # ID temporal del cliente
) {
  createExercise(input: $input, clientId: $clientId) {
    id
    # Si ya existe con clientId, retorna el existente
  }
}
```

### 2. Soporte para IDs Temporales

El backend debe aceptar IDs temporales y mapearlos a IDs reales:

```typescript
// Backend: resolver
@Mutation(() => Exercise)
createExercise(
  @Args('input') input: CreateExerciseInput,
  @Args('clientId', { nullable: true }) clientId?: string
) {
  // Si clientId ya fue sync, retornar existente
  if (clientId) {
    const existing = await this.exerciseService.findByClientId(clientId);
    if (existing) return existing;
  }
  return this.exerciseService.create({ ...input, clientId });
}
```

### 3. API de Sincronización

Crear endpoint para sincronizar datos offline:

```graphql
type SyncResponse {
  exercises: [Exercise!]!
  routines: [RoutineDay!]!
  plans: [RoutinePlan!]!
  deletedExercises: [ID!]!
  deletedRoutines: [ID!]!
  deletedPlans: [ID!]!
}

mutation SyncClientData($clientData: ClientDataInput!) {
  syncClientData(input: $clientData) {
    exercises { id name category }
    routines { id title type exercises { id } }
    # ... otros entidades
  }
}
```

### 4. Conflict Resolution

Estrategias para resolver conflictos:

| Estrategia | Descripción | Cuándo usarla |
|------------|-------------|---------------|
| **Last-Write-Wins** | El último cambio gana | Datos simples (ejercicios) |
| **Merge** | Combinar cambios | Datos complejos (rutinas) |
| **Manual** | Usuario resuelve | Conflictos reales |

Implementación sugerida:

```typescript
// backend - conflict resolution
async function resolveConflict<T>(
  local: T,
  server: T,
  entity: string
): Promise<T> {
  switch (entity) {
    case 'exercise':
      // Last-write-wins para ejercicios
      return local.updatedAt > server.updatedAt ? local : server;
    case 'routine':
      // Merge para rutinas (combinar ejercicios)
      return mergeRoutines(local, server);
    default:
      return local;
  }
}
```

### 5. Timestamps en Todas las Entidades

```typescript
// Schema - todas las entidades
@ObjectType()
@Schema({ timestamps: true })
export class Exercise {
  @Prop({ default: () => new Date() })
  createdAt: Date;

  @Prop({ default: () => new Date() })
  updatedAt: Date;

  @Prop()
  clientId?: string; // ID temporal del cliente offline
}
```

### 6. Soft Deletes

En lugar de删除 permanente, marcar como eliminado:

```typescript
@Prop({ default: false })
isDeleted: boolean;

@Prop()
deletedAt: Date;
```

---

## Orden de Implementación

| Phase | Descripción | Prioridad |
|-------|-------------|-----------|
| 1 | IndexedDB wrapper + StorageService | 🔴 Alta |
| 2 | Refactor ExercisesService (cache-first) | 🔴 Alta |
| 3 | Refactor RoutinesService (cache-first) | 🔴 Alta |
| 4 | SyncQueue para operaciones offline | 🟡 Media |
| 5 | NetworkService + UI indicador | 🟡 Media |
| 6 | Service Worker config (ngsw) | 🟡 Media |
| 7 | Backend: idempotency keys | 🔴 Alta |
| 8 | Backend: sync endpoint | 🟡 Media |
| 9 | Conflict resolution | 🟢 Baja |

---

## Testing

### Pruebas Offline

```typescript
// test/offline.spec.ts
describe('Offline Mode', () => {
  beforeEach(() => {
    navigator.onLine = false;
  });

  it('should return cached exercises', async () => {
    await service.createExercise({ name: 'Press Banca' });
    const exercises = await service.getExercises().toPromise();
    expect(exercises.length).toBe(1);
  });

  it('should queue mutations when offline', async () => {
    await service.createExercise({ name: 'Sentadilla' });
    const queue = await syncQueue.getAll();
    expect(queue.length).toBe(1);
  });
});
```

---

## Referencias

- [Google Web Dev - Offline First](https://web.dev/offline-first/)
- [MDN - IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Angular Service Worker](https://angular.io/guide/service-worker-intro)
- [PWA Checklist](https://developers.google.com/web/progressive-web-apps/checklist)
