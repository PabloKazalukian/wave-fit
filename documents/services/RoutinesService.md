# 🏋️ RoutinesService

Documentación del servicio de rutinas.

---

## 🏗️ Arquitectura

Routines utiliza **Service + API** con separación:

```
routines.service.ts         # Service principal con caché BehaviorSubject
└── api/
    └── routines-api.service.ts  # Llamadas GraphQL
```

---

## 📁 Archivos

```
src/app/core/services/routines/
├── routines.service.ts          # Service principal
└── api/
    └── routines-api.service.ts   # GraphQL API
```

---

## Service Principal (RoutinesService)

### Estado

- `routinesCache$`: BehaviorSubject con rutinas en caché
- `routines$`: Observable filtrado (excluye null)
- `loading`: Bandera de carga

### Métodos

| Método                            | Descripción                                         |
| --------------------------------- | --------------------------------------------------- |
| `getAllRoutines()`                | Obtiene todas las rutinas. Usa caché si disponible. |
| `updateAllRoutines()`             | Fuerza refresh desde API con delay de 2s.           |
| `getRoutineById(id)`              | Obtiene rutina específica por ID.                   |
| `getRoutinesPlans()`              | Obtiene planes de rutina del usuario.               |
| `getRoutinePlanById(id)`          | Obtiene plan de rutina por ID.                      |
| `getRoutinesByCategory(category)` | Filtra rutinas por categoría.                       |
| `createRoutine(data)`             | Crea una nueva rutina.                              |

---

## API (RoutinesApiService)

Contiene las consultas GraphQL para rutinas.

---

## Flujo de Datos

### getAllRoutines()

```
1. Verifica routinesCache$.value y loading
2. Si hay caché y no cargando: retorna Observable del caché
3. Si no: llama updateAllRoutines()
4. delay(2000) simula carga
5. Actualiza caché y retorna Observable
```

### getRoutinesByCategory()

```
1. Llama getAllRoutines()
2. Filtra por category usando switchMap
3. Retorna rutinas que incluyen la categoría
```

---

## Interfaces

```typescript
interface RoutineDay {
    id?: string;
    title: string;
    type?: ExerciseCategory[];
    exercises?: Exercise[];
    day?: DayIndex;
    kind?: KindType;
    expanded?: boolean;
}

interface RoutineDayCreate {
    title: string;
    type?: ExerciseCategory[];
    exercises?: Exercise[];
    planId?: string;
}

type KindType = 'REST' | 'WORKOUT';
type DayIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type ExerciseCategory = 'CHEST' | 'BACK' | 'SHOULDERS' | 'LEGS' | 'ARMS' | 'CORE';
```

---

## Queries GraphQL

```graphql
query {
    routineDays {
        id
        title
        type
        exercises {
            id
            name
        }
    }
}

mutation createRoutineDay($input: CreateRoutineDayInput!) {
    createRoutineDay(createRoutineDayInput: $input) {
        id
        title
        type
    }
}
```
