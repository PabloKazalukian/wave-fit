# Extra Sessions

## Context

An **ExtraSession** is additional training beyond the planned workout (CARDIO, STRENGTH, SPORT, MIND_BODY). It is attached to the active day — either a week-log day or the day-log's global session. The same widget/service works for both containers by delegating through the `WorkoutStore` (`WORKOUT_STORE`) and `ActiveTracking`.

## Requirements

### FR: Functionality

- **FR-001** `loadCatalog()` loads the `ExtraSessionDisciplineConfig[]` catalog once (cached in a `BehaviorSubject`).
- **FR-002** The shared `extraSessionForm` (ReactiveForms, owned by `ExtraSessionService` and reused by the form/create widgets) captures `category`, `discipline`, `workoutSessionId`, `date`, `duration`, `intensityLevel`, `calories`, `notes` (`minLength(3)` on `category` and `discipline`); only the `CreateExtraSessionForm` subset is sent.
- **FR-003** `create(input)` delegates by active container: day-log → `PlanDayService.updateExtraSession(input)`; week-log → `PlanTrackingService.updateExtraSession(date, input)` (BR-008).
- **FR-004** `remove(id)` delegates to `PlanDayService.removeExtraSession(id)` (day) or `PlanTrackingService.removeExtraSession(date, id)` (week).
- **FR-005** `update(input)` calls the API and reflects the change in `activeWorkoutSessions$`.
- **FR-006** `extraSessions` signal is derived from the store's `workoutSession().extras` ids, loading via `getByIds(ids)` (auto-refresh with signals + effect).
- **FR-007** `loadByWorkoutSession(workoutSessionId: string[])` fetches sessions for a given set of ids (delegates to `ExtraSessionApi.getByIds`).

### BR

`BR-001` (container exclusivity through `ActiveTracking.isDayLogActive()`), `BR-008` (extra sessions belong to a WorkoutSession; MET calorie estimation) apply — calorie estimation is implemented in the widgets (`extra-session-create`, `extra-session-card`), not in the service.

### NFR

- **NFR-001** Catalog is fetched once per session.
- **NFR-002** Session list stays in sync with the active store's `extras` ids without manual refresh.

## Constraints

- **No storage layer**: state lives in the `WorkoutStore` (week: `WorkoutStateService`, day: `DayWorkoutStore`) — do not add a storage service.
- The `workoutSessionId` field is **not part of `CreateExtraSessionForm`** (filled from the active session context).
- The form's `date` control is a JS `Date` but is not sent; the payload `date` is the active day's `LocalDate` from the store (`selectedDate`).
- `CreateExtraSessionContext` and `mapToUpdateWeekLogExtraSessionInput` (`extra-session.wrapper.ts`, which hardcodes `workoutSessionId: '1'`) are currently unused — legacy retained.

## Architecture

```
ExtraSessionService (core/services/extra-session/extra-session.service.ts)
├── ExtraSessionApi (core/services/extra-session/api/extra-session.api.ts) — GraphQL (extra-session.queries)
├── WORKOUT_STORE (workout-store.interface.ts)                              — active session/extras ids
├── ActiveTrackingService                                                   — week/day delegation
├── PlanTrackingService (week path)  ── updateExtraSession/removeExtraSession
└── PlanDayService (day path)         ── updateExtraSession/removeExtraSession
```

Widgets: `shared/components/widgets/extra-session/` (`extra-session-form`, `extra-session-create`, `extra-session-content`), used by tracking weeks and the my-day tracking day.

## Data contract

```ts
export enum ExtraSessionCategory {
    CARDIO = 'CARDIO',
    STRENGTH = 'STRENGTH',
    SPORT = 'SPORT',
    MIND_BODY = 'MIND_BODY',
}

export interface ExtraSessionDisciplineConfig {
    key: string;
    label: string;
    category: ExtraSessionCategory;
    met: number;
}

export interface ExtraSession {
    id: string;
    userId: string;
    workoutSessionId?: string;
    category: ExtraSessionCategory;
    discipline: string;
    date: string | Date;
    duration: number;
    intensityLevel: number;
    calories?: number;
    notes?: string;
}

export interface CreateExtraSessionForm {
    date: string;
    discipline: string;
    duration: number;
    intensityLevel: number;
    calories?: number;
    notes?: string;
}
export interface UpdateExtraSessionInput {
    id: string;
    discipline?: string;
    date?: string;
    duration?: number;
    intensityLevel?: number;
    calories?: number;
    notes?: string;
}

// week-log day payload context
export interface CreateExtraSessionContext {
    weekLogId: string;
    dayOrder: number;
    extraSession: CreateExtraSessionForm;
}
```

## Files

```
src/app/core/services/extra-session/extra-session.service.ts        (+ .spec.ts)
src/app/core/services/extra-session/api/extra-session.api.ts        (+ .spec.ts)
src/app/core/apollo/extra-session.queries.ts
src/app/shared/interfaces/extra-session.interface.ts
src/app/shared/wrappers/extra-session.wrapper.ts
src/app/shared/components/widgets/extra-session/  (extra-session-form, extra-session-create, extra-session-content + extra-session-card)
```

## Tests

- **TEST-001** `loadCatalog` caches the catalog after first fetch.
- **TEST-002** `create` routes to `PlanDayService.updateExtraSession` when day-log active and to `PlanTrackingService.updateExtraSession` when week-log active.
- **TEST-003** `remove` routes per active container.
- **TEST-004** `update` mutates `activeWorkoutSessions$`.
- **TEST-005** `extraSessions` reacts to store `extras` id changes and calls `getByIds`.

## Acceptance Criteria

- **AC-001** The user can add/update/remove a cardio/strength/sport/mind-body session on the active day in both week and day modes.
- **AC-002** Calories are estimated from the discipline `met` where provided.
- **AC-003** Lists stay consistent after create/update/remove without manual reload.
