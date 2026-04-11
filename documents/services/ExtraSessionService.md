# 🏃 ExtraSessionService

Documentación del servicio de sesiones extras (running, yoga, cycling, etc.).

---

## 🏗️ Arquitectura

ExtraSessionService sigue el patrón **API + Storage** (media complejidad):

```
extra-session.service.ts  # Service principal
extra-session.api.ts   # GraphQL queries/mutations
```

### ¿Por qué API + Storage?

Las sesiones extras son relativamente simples:
- No hay lógica de negocio compleja
- Se cachean en localStorage
- No requieren estado reactivo complejo

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

## API Pública

### Métodos

| Método                         | Descripción                                   |
| ----------------------------- | ------------------------------------------ |
| `getExtraSessions(weekStart)`  | Obtiene sesiones extras de una semana         |
| `addExtraSession(session)`   | Añade una sesión extra                  |
| `updateExtraSession(id, session)` | Actualiza una sesión extra        |
| `deleteExtraSession(id)`    | Elimina una sesión extra               |

---

## Arquitectura de Datos

```
ExtraSessionService
    │
    ├── ExtraSessionApi (GraphQL)
    │       │
    │       ├── getExtraSessions
    │       ├── createExtraSession
    │       ├── updateExtraSession
    │       └── deleteExtraSession
    │
    └── ExtraSessionStorage (localStorage)
            │
            ├── getCached()
            └── cache()
```

---

## Interfaces

```typescript
interface ExtraSession {
    id: string;
    userId: string;
    type: ExtraSessionType;
    date: Date;
    duration: number;
    notes?: string;
}

type ExtraSessionType = 'running' | 'yoga' | 'cycling' | 'swimming' | 'other';
```

---

## Tipos de Sesiones Soportadas

| Tipo       | Descripción              |
| ---------- | ---------------------- |
| `running`  | Correr/Carrera          |
| `yoga`     | Yoga                   |
| `cycling`  | Ciclismo                |
| `swimming` | Natación               |
| `other`   | Otra actividad          |

---

## Relación con PlanTrackingService

```
ExtraSessionService
        │
        └── PlanTrackingService.getExtraSessions()
        
Eltracking semanal incluye sesiones extras
```

---

## Notas

- Se usa principalmente para actividades fuera del gym
- Se muestra en My Week junto con workouts regulares
- No requiere estado reactivo complejo