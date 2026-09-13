# 🏃 ExtraSessionService

Documentación del servicio de sesiones extras (cardio, fuerza, deporte, mente-cuerpo).

---

## 🏗️ Arquitectura

`ExtraSessionService` sigue el patrón **State + API** (media complejidad). **NO hay Storage** (nada de localStorage/IndexedDB); el estado es reactivo en memoria (Signals + BehaviorSubject + FormGroup).

```
extra-session.service.ts     # Service principal (state reactivo + delegación)
api/extra-session.api.ts     # GraphQL
```

### Flujo

- `create()` / `remove()` delegan en **`PlanTrackingService.updateExtraSession/removeExtraSession`** (que persisten en el week-log del día).
- `update()` llama a `ExtraSessionApi.update` y actualiza el cache reactivo local.

---

## 📁 Archivo

```
src/app/core/services/extra-session/
├── extra-session.service.ts
├── extra-session.service.spec.ts
└── api/
    ├── extra-session.api.ts
    └── extra-session.api.spec.ts
```

---

## 🧩 Estado y Signals

| Item                      | Tipo                                         | Descripción                                                    |
| ------------------------- | -------------------------------------------- | -------------------------------------------------------------- |
| `catalog$`                | `Observable<ExtraSessionDisciplineConfig[]>` | Catálogo de disciplinas (cargado una vez)                      |
| `activeWorkoutSessions$`  | `Observable<ExtraSession[]>`                 | Sesiones extra del workout activo                              |
| `extraSessionIds`         | `computed<string[]>`                         | `state.workoutSession()?.extras` (desde `WorkoutStateService`) |
| `extraSessions`           | `signal<ExtraSession[]>`                     | Sesiones cargadas por ids                                      |
| `extraSessions$`          | `toSignal` reactivo a `extraSessionIds`      | Refetchea `getByIds(ids)` al cambiar                           |
| `currentWorkoutSessionId` | `signal<string \| null>`                     | Workout activo (en desuso)                                     |
| `extraSessionForm`        | `FormGroup`                                  | Formulario tipado con validadores                              |

**Efecto del constructor:** al cambiar `extraSessionIds`, carga las sesiones con `api.getByIds(ids)`.

---

## Métodos (Service)

| Método                      | Descripción                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `loadCatalog()`             | Carga el catálogo de disciplinas (`getCatalog`, `cache-first`), solo si está vacío           |
| `loadByWorkoutSession(ids)` | Carga sesiones extra por ids y las setea en el estado reactivo                               |
| `create(input)`             | Delega en `PlanTrackingService.updateExtraSession(selectedDate, input)`                      |
| `update(input)`             | `ExtraSessionApi.update` + actualiza cache local (`activeWorkoutSessions$`, `extraSessions`) |
| `remove(id)`                | Delega en `PlanTrackingService.removeExtraSession(selectedDate, id)`                         |

> **`create`/`remove` requieren `state.selectedDate()`** (WorkoutStateService); si no hay fecha devuelven `of(null)`.

---

## 🌐 API — `extra-session.api.ts`

| Método                    | Query/Mutation                  | Notas          |
| ------------------------- | ------------------------------- | -------------- |
| `getCatalog()`            | `GET_EXTRA_SESSION_CATALOG`     | `cache-first`  |
| `getByWorkoutSession(id)` | `GET_EXTRA_SESSIONS_BY_WORKOUT` | `network-only` |
| `getByIds(ids)`           | `GET_EXTRA_SESSIONS_BY_IDS`     | `network-only` |
| `update(input)`           | `UPDATE_EXTRA_SESSION`          |                |
| `remove(id)`              | `REMOVE_EXTRA_SESSION`          |                |

> `CREATE_EXTRA_SESSION` está **comentado** en `core/apollo/extra-session.queries.ts` (la creación real pasa por el week-log).

---

## 💡 Modelo de Datos (`shared/interfaces/extra-session.interface.ts`)

```typescript
enum ExtraSessionCategory {
    CARDIO = 'CARDIO',
    STRENGTH = 'STRENGTH',
    SPORT = 'SPORT',
    MIND_BODY = 'MIND_BODY',
}

interface ExtraSessionDisciplineConfig {
    key: string;
    label: string;
    category: ExtraSessionCategory;
    met: number;
}

interface ExtraSession {
    id: string;
    userId: string;
    workoutSessionId: string;
    category: ExtraSessionCategory;
    discipline: string;
    date: string | Date;
    duration: number;
    intensityLevel: number;
    calories?: number;
    notes?: string;
}

interface CreateExtraSessionForm {
    date: string;
    discipline: string;
    duration: number;
    intensityLevel: number;
    calories?: number;
    notes?: string;
}
```

> La sesión extra pertenece a un **`workoutSessionId`** de un week-log. El catálogo de disciplinas trae un `met` (para estimar calorías).

---

## Notas

- **No persiste localmente** (fue corregido: antes se documentaba como "API + Storage", no es correcto).
- Depende de `WorkoutStateService` (fecha activa) y `PlanTrackingService` (crear/eliminar en el week-log).
- `ExtraActivityVM` quedó deprecada; se usa `ExtraSession`.
