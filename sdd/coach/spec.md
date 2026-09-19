# Coach AI

## Context

The Coach is an AI-driven plan generator. The user describes their goal ('comment'), the backend produces a `TrainingPlanDetail` with days/exercises, the user can revise it (`modifyPlan`), confirm it, and the confirmed plan materializes into the tracking/template branches (`week-log`, `routine plan`, or adapting the active week). `/coach` also shows plan history and AI usage.

## Requirements

### FR: Functionality

- **FR-001** `/coach` hosts the chat/generate flow, plan history list, and usage meter.
- **FR-002** `generatePlan(comment)` calls `generatePlan` GraphQL mutation (with `handleGraphqlError`).
- **FR-003** `modifyPlan(id, comment)` requests an AI revision of an existing plan.
- **FR-004** `confirmPlan(id, action)` materializes the plan; `action` is one of:
    - `CREATE_WEEK_LOG` — seed a week-log,
    - `CREATE_ROUTINE_PLAN` — create a template `RoutinePlan`,
    - `ADAPT_ACTIVE_WEEK` — adapt the currently active week.
- **FR-005** `getPlanTrainings(limit, offset)` paginates plan history (`fetchPolicy: 'network-only'`, returns `TrainingPlansPage`).
- **FR-006** `getPlanTrainingById(id)` reads a plan detail (snapshot) with Apollo default `cache-first` (unlike the list and usage queries).
- **FR-007** `removePlantraningById(id)` deletes a generated plan.
- **FR-008** `getAiUsageStatus()` returns `AiUsageStatus { used, limit, remaining, resetAt }` (network-only).
- **FR-009** Local state/persistence: `coach.state.ts` (class `CoachState`) exposes the **single active plan** (`activePlan`, signals) reactive state; `storage/coach.storage.ts` persists that plan per user in **localStorage** (synchronous). Plan history is served by the API (`GetTrainingPlans`), not stored locally.

### BR

- `BR-001`/`BR-002` (the `confirmPlan` action determines the target branch) and `BR-012` (sync for local drafts) apply.

### NFR

- **NFR-001** List queries bypass the Apollo cache (`network-only`).
- **NFR-002** AI responses are snapshotted (`AiSnapshot { modelUsed, tokensUsed, rawResponse: AiPlanResponse | string }`) for reproducibility.

## Constraints

- Generation is **slow** (LLM); the UI must handle pending/loading and errors.
- `AiPlanResponse` is the raw AI payload (`title`, `focus`, `durationWeeks`, `daysPerWeek`, `days[]`); it feeds the seed mapping — do not alias it as `TrainingPlanDetail`.
- Legacy naming survives only in the service method `removePlantraningById`; the GraphQL operation is the clean `removeTrainingPlan`. No `Plantraning` naming is kept in the API layer.

## Architecture

```
CoachService (core/services/coach/coach.service.ts)   — GraphQL + handleGraphqlError
├── CoachState (core/services/coach/coach.state.ts)                      — single active-plan state
├── CoachStorage (core/services/coach/storage/coach.storage.ts)          — localStorage per user
├── coach.query.ts / ai-usage.query.ts (core/apollo)
├── utils/ai-plan.adapter.ts                          — AiPlanResponse → TrackingVM seed mapping
└── shared/interfaces/coach.interface.ts  (+ ai-plan.interface.ts)
```

Page: `CoachComponent` (chat panel → `generatePlan`/`modifyPlan` → confirm → navigate to resulting week-log or routine plan).

## Data contract (core)

```ts
export type PlanConfirmationAction =
    | 'CREATE_WEEK_LOG'
    | 'CREATE_ROUTINE_PLAN'
    | 'ADAPT_ACTIVE_WEEK';

export interface AiUsageStatus {
    used: number;
    limit: number;
    remaining: number;
    resetAt: string;
}

export interface TrainingPlansPage {
    items: TrainingPlanListItem[];
    total: number;
    limit: number;
    offset: number;
    totalPages: number;
}

export interface TrainingPlanDetail {
    id: string;
    title: string;
    description: string | null;
    focus: string;
    status: string;
    startDate: string;
    endDate: string;
    durationWeeks: number;
    trainingDaysPerWeek: number;
    tags: string[];
    aiSnapshot: AiSnapshot;
    confirmed?: boolean;
    confirmedAction?: PlanConfirmationAction | null;
    resultingWeekLogId?: string | null;
    resultingRoutinePlanId?: string | null;
    version?: number;
}

export interface ConfirmPlanOutput {
    trainingPlan: ConfirmedTrainingPlan;
    weekLog: WeekLogResult | null; // { id, startDate, endDate, days[] }
    routinePlan: RoutinePlanAPI | null;
}
```

## Files

```
src/app/core/services/coach/coach.service.ts   (+ .spec.ts)
src/app/core/services/coach/coach.state.ts   (+ .spec.ts)
src/app/core/services/coach/storage/coach.storage.ts   (+ .spec.ts)
src/app/core/apollo/coach.query.ts | ai-usage.query.ts
src/app/shared/interfaces/coach.interface.ts | ai-plan.interface.ts
src/app/pages/coach/
src/app/shared/components/widgets/coach/
```

## Tests

- **TEST-001** `generatePlan` maps `data.generatePlan` and handles GraphQL errors. ✅ (`coach.service.spec.ts`)
- **TEST-002** `confirmPlan` passes `action` and surfaces `ConfirmPlanOutput`. ✅ (`coach.service.spec.ts`)
- **TEST-003** `getPlanTrainings` uses `network-only` and maps the page. ✅ (`coach.service.spec.ts`)
- **TEST-004** `state`/`storage` persist drafts across navigation. ✅ (`coach.state.spec.ts`, `storage/coach.storage.spec.ts`)

## Acceptance Criteria

- **AC-001** The user generates an AI plan from a comment, sees usage, and can revise it.
- **AC-002** Confirming with `CREATE_WEEK_LOG`/`CREATE_ROUTINE_PLAN`/`ADAPT_ACTIVE_WEEK` lands on the resulting week-log or routine plan.
- **AC-003** History is paginated and a plan can be reopened or removed.
