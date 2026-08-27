# 🤖 CoachService

Servicio de la página `/coach` (Coach AI). Arquitectura **API + Service** (baja complejidad).

---

## Ubicación

```
core/services/coach/coach.service.ts
core/apollo/coach.query.ts       # Consultas/mutaciones del plan
core/apollo/ai-usage.query.ts    # Cuota diaria de IA
shared/interfaces/coach.interface.ts
shared/interfaces/ai-plan.interface.ts
```

## Arquitectura

```
CoachService (root, providedIn)
  ├── Apollo (GraphQL)
  └── AuthService → handleGraphqlError (loguea el error y expira sesión si el token no es válido)

Sin cache local (cada llamada va a la API, fetchPolicy network-only en los listados).
```

## Métodos

| Método | Tipo | Variables | Observaciones |
| ------ | ---- | --------- | ------------- |
| `generatePlan(comment = '')` | Mutation `GENERATE_PLAN` | `{ comment }` | Devuelve `TrainingPlanDetail \| null` |
| `getPlanTrainings(limit, offset)` | Query `GET_TRAINING_PLANS` | `{ limit, offset }` | Paginado, `network-only` → `TrainingPlansPage \| null` |
| `getPlanTrainingById(id)` | Query `GET_TRAINING_PLAN` | `{ id }` | `TrainingPlanDetail \| null` |
| `removePlantraningById(id)` | Mutation `REMOVE_TRAINING_PLAN` | `{ id }` | ⚠️ typo "tranking" en el nombre |
| `confirmPlan(id, action)` | Mutation `CONFIRM_PLAN` | `{ id, action }` | `action ∈ PlanConfirmationAction` → `ConfirmPlanOutput \| null` |
| `getAiUsageStatus()` | Query `GET_AI_USAGE_STATUS` | — | `network-only` → `AiUsageStatus \| null` |

## Consumidores

| Consumidor | Métodos usados |
| ---------- | -------------- |
| `Coach` (página) | `removePlantraningById` (borrar plan en manage mode) |
| `ListPlanTraining` | `getPlanTrainings` |
| `CoachGeneratePlan` | `generatePlan`, `getAiUsageStatus`, `removePlantraningById` |
| `CoachManageWithPlanFacade` | `getPlanTrainingById`, `confirmPlan` |

## Tipos clave (`coach.interface.ts`)

- `TrainingPlanDetail` — plan generado por IA (`id`, `title`, `startDate`, `aiSnapshot.rawResponse`, `resultingRoutinePlanId`...).
- `TrainingPlansPage` — `{ items, total, totalPages, page }`.
- `PlanConfirmationAction` — `'CREATE_WEEK_LOG' | 'CREATE_ROUTINE_PLAN' | 'ADAPT_ACTIVE_WEEK'`.
- `ConfirmPlanOutput` — contiene el `routinePlan` resultante y el `trainingPlan`.
- `AiUsageStatus` — `{ used, limit, remaining, resetAt }`.

`aiSnapshot.rawResponse` es un JSON (string u objeto) con la estructura `AiPlanResponse { days: AiPlanDay[] }`; lo parsen el facade (`buildTrackingVM`) para armar la semana visual.