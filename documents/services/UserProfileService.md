# 👤 UserProfileService

Documentación del servicio de gestión de perfil de usuario (`UserProfile`).

---

## 🏗️ Arquitectura

`UserProfileService` sigue el patrón de **alta complejidad** completo, separando responsabilidades en capas claras:

```
user-profile.service.ts     # Fachada (Orquesta vistas y estado)
user-profile.domain.ts      # Domain Service (Lógica de negocio y sanitización)
user-profile.state.ts       # State (Signals reactivas de dominio)
api/
├── user-profile-api.service.ts      # Delegador de consultas y modificaciones
├── user-profile-api.get.service.ts  # Queries GraphQL
└── user-profile-api.set.service.ts  # Mutations GraphQL
```

### Principio de Inversión de Dependencias y Sanitización

1. **Capa API (`api/`):** Realiza las llamadas a GraphQL y devuelve los tipos con la estructura cruda de la base de datos (por ejemplo, con el campo `_id` característico de MongoDB).
2. **Capa Domain (`user-profile.domain.ts`):** Procesa la respuesta de la API y utiliza un mapper wrapper (`profile.wrapper.ts`) para sanitizar los datos, convirtiendo los campos de persistencia `_id` en campos de dominio `id`.
3. **Capa State (`user-profile.state.ts`):** Mantiene el estado reactivo únicamente en base a los modelos de dominio sanitizados.
4. **Capa Service/Facade (`user-profile.service.ts`):** Suscribe las operaciones y actualiza el State correspondientemente.

---

## 📁 Archivos

```
src/app/core/services/user/
├── user-profile.service.ts
├── user-profile.domain.ts
├── user-profile.state.ts
└── api/
    ├── user-profile-api.service.ts
    ├── user-profile-api.get.service.ts
    └── user-profile-api.set.service.ts
```

---

## API Pública

### Signals (State)

| Signal        | Tipo                  | Descripción                                   |
| ------------- | --------------------- | --------------------------------------------- |
| `userProfile` | `ProfileUser \| null` | Contiene el perfil del usuario autenticado    |
| `loading`     | `boolean`             | Indica si hay operaciones de carga en curso   |
| `error`       | `string \| null`      | Almacena el mensaje del último error ocurrido |

### Métodos (Service Facade)

| Método                     | Retorno                           | Descripción                                                 |
| ────────────────────────── | --------------------------------- | ----------------------------------------------------------- |
| `fetchUserProfile()`       | `Observable<ProfileUser \| null>` | Carga/refresca y actualiza el estado del perfil de usuario  |
| `updateProfile(input)`     | `Observable<ProfileUser \| null>` | Actualiza la información básica del perfil                  |
| `updateSchedule(input)`    | `Observable<Schedule \| null>`    | Actualiza la planificación y días disponibles               |
| `updateGoals(input)`       | `Observable<Goal \| null>`        | Modifica los objetivos principales y secundarios            |
| `updateHealth(input)`      | `Observable<HealthConstraint \| null>` | Modifica las restricciones de salud y lesiones              |
| `updateResource(input)`    | `Observable<Resource \| null>`    | Modifica los equipamientos y entornos de entrenamiento       |
| `createStrengthMetric(in)` | `Observable<StrengthMetric \| null>`| Añade una métrica de un ejercicio (1RM)                     |
| `createWeightLog(input)`   | `Observable<WeightLog \| null>`   | Añade un registro de peso e índice de grasa                 |

---

## Flujo de Datos

### Carga de Datos (initUserProfile)

```
1. AuthService inicializa/detecta el usuario autenticado.
2. UserProfileService reacciona al usuario y llama a initUserProfile() en el Domain.
3. UserProfileDomainService llama a getUserProfileContext() de UserProfileApiService.
4. UserProfileApiService delega a UserProfileApiGetService (GraphQL query).
5. GraphQL devuelve UserProfileContextAPI (con _id).
6. UserProfileDomainService mapea a ProfileUser (sanitizado con id vía profile.wrapper.ts).
7. UserProfileService recibe el objeto mapeado en el subscribe() y actualiza el State.
8. La señal reactiva userProfile() se propaga a las vistas (ej. Coach, Profile).
```

---

## Sanitización de Modelos (Wrappers)

Los wrappers transforman la representación física de persistencia (`_id`) a la representación lógica del dominio (`id`).

```typescript
// Ejemplo de mapeo de GoalAPI a Goal (Dominio)
export function wrapperGoalToDomain(api: GoalAPI | null | undefined): Goal | null {
    if (!api) return null;
    return {
        id: api._id, // Transformación de _id a id
        userId: api.userId,
        primaryGoal: api.primaryGoal,
        secondaryGoals: api.secondaryGoals || [],
        targetWeightKg: api.targetWeightKg,
        timelineWeeks: api.timelineWeeks,
        trainingExperience: api.trainingExperience,
        sportSpecificity: api.sportSpecificity,
        isActive: api.isActive,
        createdAt: api.createdAt,
        updatedAt: api.updatedAt,
    };
}
```
