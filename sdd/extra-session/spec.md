# Extra Sessions

## Context

An **ExtraSession** is additional training beyond the planned workout (CARDIO, STRENGTH, SPORT, MIND_BODY). In the active flow it is attached to the active day — either a week-log day or the day-log's global session — through `WorkoutStore` (`WORKOUT_STORE`) and `ActiveTracking` (BR-008). In the deferred flow the shared widgets are reused, but the target container is supplied explicitly by the owning page; no deferred write is routed through `ActiveTracking` (FR-009).

## Requirements

### FR: Functionality

- **FR-001** `loadCatalog()` loads the `ExtraSessionDisciplineConfig[]` catalog once (cached in a `BehaviorSubject`).
- **FR-002** The shared `extraSessionForm` (ReactiveForms, owned by `ExtraSessionService` and reused by the form/create widgets) captures `category`, `discipline`, `workoutSessionId`, `date`, `duration`, `intensityLevel`, `calories`, `notes` (`minLength(3)` on `category` and `discipline`); only the `CreateExtraSessionForm` subset is sent. The create widget exposes a **notes field** bound to the shared form; `extra-session-form.save()` sends the control's real value (not a hardcoded empty string). The form validates and emits `saveExtraSession`; the owning container performs the write (FR-009).
- **FR-003** `create(input)` delegates by active container: day-log → `PlanDayService.updateExtraSession(input)`; week-log → `PlanTrackingService.updateExtraSession(date, input)` (BR-008).
- **FR-004** `remove(id)` delegates to `PlanDayService.removeExtraSession(id)` (day) or `PlanTrackingService.removeExtraSession(date, id)` (week).
- **FR-005** `update(input)` calls the API and reflects the change in `activeWorkoutSessions$`.
- **FR-006** `extraSessions` signal is derived from the store's `workoutSession().extras` ids, loading via `getByIds(ids)` (auto-refresh with signals + effect).
- **FR-007** `loadByWorkoutSession(workoutSessionId: string[])` fetches sessions for a given set of ids (delegates to `ExtraSessionApi.getByIds`).
- **FR-008** The editable card (`extra-session-card`) displays the session `notes` when present and allows **editing them** in its edit mode; the `save` output includes `notes`, and `extra-session-content` forwards it to `ExtraSessionService.update` → `UpdateExtraSessionInput.notes`.
- **FR-009** In the deferred flow the form is I/O-only: it never calls `ExtraSessionService.create` and never reads `WORKOUT_STORE`. The parent page performs the mutation against the explicit target (`dayLogId` / `weekLogId` / owning `workoutSessionId`), so an extra-session added while editing a deferred day is not also written to the active day. Deferred writes do not modify active tracking state, active day-log state or local storage.
- **FR-010** Removing an extra-session from a day-log sends the owning `workoutSessionId` (backend contract `RemoveExtraSessionFromDayLog($workoutSessionId: String!)`), not the extra-session id.

### BR

`BR-001` (container exclusivity through `ActiveTracking.isDayLogActive()`), `BR-008` (extra sessions belong to a WorkoutSession; MET calorie estimation) apply — calorie estimation is implemented in the widgets (`extra-session-create`, `extra-session-card`), not in the service.

### NFR

- **NFR-001** Catalog is fetched once per session.
- **NFR-002** Session list stays in sync with the active store's `extras` ids without manual refresh.

## Constraints

- **No storage layer**: state lives in the `WorkoutStore` (week: `WorkoutStateService`, day: `DayWorkoutStore`) — do not add a storage service.
- The `workoutSessionId` field is **not part of `CreateExtraSessionForm`**; the owner fills it from the active session in the active flow, or from the loaded deferred container in the deferred flow (FR-009).
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

Widgets: `shared/components/widgets/extra-session/` (`extra-session-form`, `extra-session-create`, `extra-session-content` + `extra-session-card`), used by tracking weeks and the my-day tracking day; the card shows/edits `notes` (FR-008) and the form/create collect `notes` (FR-002). The same form and card are hosted by `WorkoutSessionEditor` in the deferred page, where the page owns the write and supplies the explicit target (FR-009). `extra-session-show` is a **read-only** variant (no edit/delete) used by the training-history calendar preview (see `sdd/training-history/spec.md` FR-011).

## Data contract

- In the training-calendar payload (`trainingCalendar.days[].extraSessions`) `category` serializes as the uppercase enum (`CARDIO`) and `discipline` travels lowercase (minúscula), consistent with `extraSessionCatalog`.

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
src/app/shared/components/widgets/extra-session/  (extra-session-form, extra-session-create, extra-session-content + extra-session-card, extra-session-show)
```

## Tests

- **TEST-001** `loadCatalog` caches the catalog after first fetch. ✅ (`extra-session.service.spec.ts`)
- **TEST-002** `create` routes to `PlanDayService.updateExtraSession` when day-log active and to `PlanTrackingService.updateExtraSession` when week-log active. ✅ (`extra-session.service.spec.ts`)
- **TEST-003** `remove` routes per active container. ✅ (`extra-session.service.spec.ts`)
- **TEST-004** `update` mutates `activeWorkoutSessions$`. ✅ (`extra-session.service.spec.ts`)
- **TEST-005** `extraSessions` reacts to store `extras` id changes and calls `getByIds`. ✅ (`extra-session.service.spec.ts`)
- **TEST-006** `extra-session-card` shows `notes` when present and includes a notes field in edit mode; saving emits the notes value (FR-008). ✅ (`extra-session-card.spec.ts`)
- **TEST-007** `extra-session-content` forwards the edited notes to `ExtraSessionService.update` (FR-008). ✅ (`extra-session-content.spec.ts`)
- **TEST-008** The create widget renders a notes field bound to the shared form, and `extra-session-form.save()` sends the control's value instead of hardcoding `''` (FR-002). ✅ (`extra-session-create.spec.ts`, `extra-session-form.spec.ts`)
- **TEST-009** In the deferred flow the form emits `saveExtraSession` without calling `ExtraSessionService.create` or reading `WORKOUT_STORE`; the target is supplied by the page (FR-009).
- **TEST-010** Day-log extra-session deletion sends `workoutSessionId` (FR-010).

## Acceptance Criteria

- **AC-001** The user can add/update/remove a cardio/strength/sport/mind-body session on the active day in both week and day modes.
- **AC-002** Calories are estimated from the discipline `met` where provided.
- **AC-003** Lists stay consistent after create/update/remove without manual reload.
- **AC-004** Notes captured at creation are visible and editable on the tracking card, and persist on update. ✅
- **AC-005** An extra-session added from a deferred day exists only in that deferred container; the active day is unchanged.
