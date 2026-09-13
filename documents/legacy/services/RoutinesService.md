# 🏋️ RoutinesService

Documentación del servicio de rutinas.

---

## 🏗️ Arquitectura

Routines sigue **Service + API** con separación y **soporte offline** (IndexedDB + SyncQueue):

```
routines.service.ts         # Service principal con caché BehaviorSubject
└── api/
    └── routines.api.ts     # GraphQL (clase RoutinesApiService)
```

**Dependencias:** `AuthService`, `NetworkStatusService`, `IndexedDbStorageService`, `SyncQueueService`.

> ⚠️ El archivo API se llama `routines.api.ts` (no `routines-api.service.ts`); la clase interna es `RoutinesApiService`.

---

## 📁 Archivos

```
src/app/core/services/routines/
├── routines.service.ts     # Service principal
└── api/
    └── routines.api.ts     # GraphQL API
```

---

## Service Principal (RoutinesService)

### Estado

- `routinesCache$`: `BehaviorSubject<RoutineDay[] | null>` (caché de rutinas)
- `routines$`: Observable filtrado (excluye null)
- `loading`: flag privado de carga en curso
- `loadingRoutines$` / getter `loadingRoutines`: `BehaviorSubject<boolean>` público de carga

### Métodos

| Método                                    | Descripción                                                            |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| `getAllRoutines()`                        | Obtiene todas las rutinas. Usa caché si disponible y no está cargando  |
| `updateAllRoutines()`                     | Fuerza refresh desde API con `delay(500)` y persiste a IndexedDB       |
| `setIsFavorite(routineDayId, isFavorite)` | Actualiza flag de favorito en caché + IndexedDB                        |
| `getRoutineById(id)`                      | Obtiene rutina por ID (caché o API)                                    |
| `getRoutinesPlans()`                      | Obtiene planes de rutina del usuario (query **inline** con `gql`)      |
| `getRoutinePlanById(id)`                  | Obtiene plan de rutina por ID (query **inline** con `gql`)             |
| `getRoutinesByCategory(category)`         | Filtra rutinas por categoría usando `getAllRoutines`                   |
| `createRoutine(data)`                     | Crea rutina. **Online** → API; **offline** → encola `CreateRoutineDay` |

**Constructor:** registra el handler de sync `'CreateRoutineDay'` (replica la mutation al reconectar).

**Queries inline:** `getRoutinesPlans` / `getRoutinePlanById` / `createRoutine` usan `gql` inline (no desde `core/apollo/`).

---

## API (RoutinesApiService)

Contiene las consultas GraphQL para rutinas (`routines.api.ts`). Métodos: `getRoutines`, `getRoutineById`, etc.

---

## Flujo de Datos

### getAllRoutines()

```
1. Activa loadingRoutines
2. Si hay caché y no está cargando → retorna el caché
3. Si no → updateAllRoutines() (API + delay(500))
4. Actualiza caché y retorna Observable
```

### createRoutine()

```
1. Construye payload (RoutineDayCreateSend): exercises → {exercise, order}
2. Online → mutation createRoutineDay + agrega al caché
3. Offline → genera ObjectId local, encola CreateRoutineDay, update optimista
```

---

## Interfaces (`shared/interfaces/routines.interface.ts`)

```typescript
interface RoutineDay {
    id?: string;
    title: string;
    type?: ExerciseCategory[];
    exercises?: Exercise[];
    kind?: 'WORKOUT' | 'REST';
    isFavorite?: boolean; // nuevo
}
```

Tipos: `RoutineDayCreate`, `RoutineDayCreateSend` (`exercises: { exercise, order }[]`).

> `RoutinePlanAPI` (en `api/routines-api.interface.ts`) ahora incluye `isFavorite`, `isAiGenerated`, `generatedFromPlanId`, `createdBy`.

---

## Queries GraphQL utilizadas

`getRoutinesPlans` consulta:

```graphql
routinePlans { id name description weekly_distribution isFavorite isAiGenerated createdBy routineDays { id } }
```

`createRoutineDay(createRoutineDayInput) { id title type }`
