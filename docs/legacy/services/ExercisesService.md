# 💪 ExercisesService

Documentación del servicio de ejercicios.

---

## 🏗️ Arquitectura

Exercises utiliza una arquitectura **Service + API** integrada en un solo archivo, pero ahora con **soporte offline** (IndexedDB + SyncQueue):

```
exercises.service.ts  # Service + Apollo + Cache en Signal + offline
```

**Dependencias:** `AuthService` (errores), `NetworkStatusService`, `IndexedDbStorageService` (persistencia), `SyncQueueService` (cola offline).

---

## 📁 Archivo

```
src/app/core/services/exercises/
└── exercises.service.ts
```

Queries en `src/app/core/apollo/exercises.queries.ts`.

---

## API Pública

### Signals

- `exercises`: `signal<Exercise[]>` con la lista en caché (y también en IndexedDB)

### Métodos

| Método                                  | Descripción                                                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `getExercises(force = false)`           | Obtiene todos los ejercicios. Usa caché si disponible; `force=true` fuerza fetch (`network-only`) y persiste a IndexedDB |
| `createExercise(exercise)`              | Crea un nuevo ejercicio. **Online** → API; **offline** → encola `CreateExercise` en SyncQueue y genera un ObjectId local |
| `setIsFavorite(exerciseId, isFavorite)` | Actualiza el flag de favorito en caché + IndexedDB                                                                       |
| `wrapperExerciseAPItoVM()`              | Transforma ejercicios a formato para tracking (ExercisePerformanceVM)                                                    |

**Constructor:** registra el handler de sync `'CreateExercise'` (replica la mutation al reconectar).

---

## Flujo offline

`createExercise` detecta `NetworkStatusService.isOnline()`:

- **Online:** mutación `CREATE_EXERCISE` y actualiza caché/IndexedDB.
- **Offline:** genera `ObjectId` local, encola op `'CreateExercise'` en `SyncQueueService.enqueue(...)` y hace update optimista del caché local (incluida la cache GraphQL de IndexedDB).

---

## Queries GraphQL (`exercises.queries.ts`)

```graphql
query GetExercises {
    exercises {
        id
        name
        category
        usesWeight
        isFavorite
    }
}

mutation CreateExercise($input: CreateExerciseInput!) {
    createExercise(input: $input) {
        id
        name
        category
        usesWeight
    }
}
```

> ⚠️ Los campos reales son `usesWeight` e `isFavorite` (ya NO `muscle`/`equipment`).

---

## Interfaces (`shared/interfaces/exercise.interface.ts`)

```typescript
interface Exercise {
    id?: string;
    name: string;
    category: ExerciseCategory;
    usesWeight: boolean;
    isFavorite?: boolean;
}
```

> ⚠️ Antes se documentaba `muscle?`/`equipment?`; el modelo real usa `usesWeight`/`isFavorite`.
