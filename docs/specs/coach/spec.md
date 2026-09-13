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
- **FR-006** `getPlanTrainingById(id)` reads a plan detail (snapshot).
- **FR-007** `removePlantraningById(id)` deletes a generated plan.
- **FR-008** `getAiUsageStatus()` returns `AiUsageStatus { used, limit, remaining, resetAt }` (network-only).
- **FR-009** Local state/persistence: `coach.state.ts` (reactive state) and `storage/coach.storage.ts` (async IndexedDB/IDB persistence) keep drafts/history.

### BR

- `BR-001`/`BR-002` (the `confirmPlan` action determines the target branch) and `BR-012` (sync for local drafts) apply.

### NFR

- **NFR-001** List queries bypass the Apollo cache (`network-only`).
- **NFR-002** AI responses are snapshotted (`AiSnapshot.rawResponse`) for reproducibility.

## Constraints

- Generation is **slow** (LLM); the UI must handle pending/loading and errors.
- `AiPlanResponse` is the raw AI payload (`title`, `focus`, `durationWeeks`, `daysPerWeek`, `days[]`); it feeds the seed mapping — do not alias it as `TrainingPlanDetail`.
- Legacy naming (`removePlantraning`, `Plantraning`) is kept inside the API layer only.

## Architecture

```
CoachService (core/services/coach/coach.service.ts)   — GraphQL + handleGraphqlError
├── CoachStateService (core/services/coach/coach.state.ts)              — reactive state
├── CoachStorageService (core/services/coach/storage/coach.storage.ts)  — IndexedDB persistence
├── coach.query.ts / ai-usage.query.ts (core/apollo)
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
src/app/core/services/coach/coach.state.ts
src/app/core/services/coach/storage/coach.storage.ts
src/app/core/apollo/coach.query.ts | ai-usage.query.ts
src/app/shared/interfaces/coach.interface.ts | ai-plan.interface.ts
src/app/pages/coach/
src/app/shared/components/widgets/coach/
```

## Tests

- **TEST-001** `generatePlan` maps `data.generatePlan` and handles GraphQL errors.
- **TEST-002** `confirmPlan` passes `action` and surfaces `ConfirmPlanOutput`.
- **TEST-003** `getPlanTrainings` uses `network-only` and maps the page.
- **TEST-004** `state`/`storage` persist drafts across navigation.

## Acceptance Criteria

- **AC-001** The user generates an AI plan from a comment, sees usage, and can revise it.
- **AC-002** Confirming with `CREATE_WEEK_LOG`/`CREATE_ROUTINE_PLAN`/`ADAPT_ACTIVE_WEEK` lands on the resulting week-log or routine plan.
- **AC-003** History is paginated and a plan can be reopened or removed.
