# 💪 ExercisesService

Documentación del servicio de ejercicios.

---

## 🏗️ Arquitectura

Exercises utiliza una arquitectura simple **Service + API** integrada en un solo archivo:

```
exercises.service.ts  # Service + Apollo + Cache en Signal
```

### ¿Por qué no separar?

Los ejercicios no requieren lógica compleja ni estado compartido entre componentes, por lo que se mantiene todo en un solo servicio.

---

## 📁 Archivo

```
src/app/core/services/exercises/
└── exercises.service.ts
```

---

## API Pública

### Signals

- `exercises`: Signal que contiene la lista de ejercicios en caché

### Métodos

| Método                     | Descripción                                                            |
| -------------------------- | ---------------------------------------------------------------------- |
| `getExercises()`           | Obtiene todos los ejercicios. Usa caché local si disponible.           |
| `createExercise(exercise)` | Crea un nuevo ejercicio en el backend y actualiza el caché.            |
| `wrapperExerciseAPItoVM()` | Transforma ejercicios a formato para tracking (ExercisePerformanceVM). |

---

## Flujo de Datos

### getExercises()

```
1. Verifica si exercises() tiene datos
2. Si hay caché: retorna of(exercises())
3. Si no: hace query GraphQL
4. Actualiza exercises signal con el resultado
5. Retorna los datos
```

### createExercise()

```
1. Mutación GraphQL CREATE_EXERCISE
2. Recibe el ejercicio creado
3. Agrega al caché: exercises.set([...exercises(), newExercise])
4. Retorna el nuevo ejercicio
```

---

## Queries GraphQL

```graphql
query {
    exercises {
        id
        name
        category
        muscle
        equipment
    }
}

mutation createRoutineDay($input: CreateExerciseInput!) {
    createExercise(input: $input) {
        id
        name
        category
    }
}
```

---

## Interfaces

```typescript
interface Exercise {
    id: string;
    name: string;
    category: ExerciseCategory;
    muscle?: string[];
    equipment?: string;
    description?: string;
}

interface ExercisePerformanceVM {
    exerciseId: string;
    name: string;
    series: number;
    sets: { reps: number; weights?: number }[];
    category: ExerciseCategory;
}
```
