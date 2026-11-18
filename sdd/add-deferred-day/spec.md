# Add Deferred Day

## Context

This feature extends the deferred day-log editing capability to support editing a workout session (WS) from both:

- **Day-Log (DL)**: A standalone day-log container (`/user/history/deferred?date=...&id=<dayLogId>`)
- **Week-Log (WL)**: A day within a week-log container (`/user/history/week-log-day/:weekId/:dayOrder`)

The route `http://localhost:4200/user/history/deferred?date=2026-10-08&id=6adfd36e55dca9e5b80a2547` should work for editing a day from either a day-log or a week-log.

The parent component `DayDeferred` (in `day-deferred.ts`) must execute the changes for the DL or WL day. The `WorkoutSessionEditor` (in `workout-session-editor.ts`) must edit the WS within either context, using reusable components (`extra-session` and `exercise-selector`).

**Important architectural decision**: This feature does NOT use the active-tracking architecture with state/storage (like `my-week`/`my-day` do). Those components use a `BehaviorSubject`-based state that persists data for managing active week/day sessions. In `day-deferred`, we edit the WS directly via API mutations without modifying container state or local storage. The mutations respect the service-domain-api architecture.

## Requirements

### FR: Functionality

- **FR-014** The deferred page `/user/history/deferred?date=<LocalDate>&id=<dayLogId>` loads a day-log by `id` and renders a read-only demo form. It also works with only `date` (no `id`), rendering an empty form.
- **FR-015** The same route structure can represent a week-log day when accessed via `/user/history/week-log-day/:weekId/:dayOrder`. The page must detect the context and switch between DL and WL editing mode.
- **FR-016** The `WorkoutSessionEditor` can edit a workout session within a deferred day-log or within a week-log day, using the same reusable components (`ExerciseSelector`, `ExtraSessionForm`, `WorkoutEdition`).
- **FR-017** The `onCompleteDay` action in `DayDeferred` flips the day status appropriately: `completed: true, active: false` for DL; pending status for WL (with TODO for backend completion).
- **FR-018** The editor context (`EditorContext`) is computed from the route query params: if `id` is a day-log ID → `DEFERRED_DAY_LOG`; if `weekLogId` and `dayOrder` are present → `WEEK_LOG_DAY`.

### BR: Business Rules

- **BR-019** No active-tracking state is modified when editing a deferred day. The day-log or week-log container state is not persisted or changed.
- **BR-020** Mutations for DL use the day-log API (`PlanDayApi.updateDayLog` / `createWorkout`), while mutations for WL use the plan-tracking API (`PlanTrackingService`).
- **BR-021** The `date` query param is always a `LocalDate` in `yyyy-MM-dd` format. The `id` param, when present, is a day-log ID. The `weekLogId` and `dayOrder` are derived from the route params for WL context.
- **BR-022** The wrapper for API responses keeps `date` as `yyyy-MM-dd` (no timezone conversion), since the backend already sends LocalDate for deferred days.

### NFR: Non-Functional

- **NFR-003** No `setDayLog`, `setDayLogStorage`, `markDayActive`, or similar state/storage writes are performed. The feature is purely mutation-driven via the API.
- **NFR-004** API wrappers (`wrapperUpdateDayLogApiToVM`, `wrapperDayLogDeferredApiToVM`) are reused as documented in the day-log spec.
- **NFR-005** The `DayDeferred` page and `WorkoutSessionEditor` components are standalone (no framework state beyond signals) so they can be used in both DL and WL contexts without side effects.

## Constraints

- The day-log deferred creation path must not write container state, local storage or active tracking (already established in day-log spec FR-013).
- The WL day editing path must use `PlanTrackingService.findById` to load the week and resolve the day's workout session.
- The exercise-selector and extra-session form components are **not yet implemented** — they are referenced as dependencies but marked with TODO/placeholder status.
- The `DayDeferred` must work with only `date` query param (empty demo form) or with both `date` + `id` (day-log) or `date` + `weekLogId` + `dayOrder` (week-log).

## Architecture

```
DayDeferred (page)
├── Activates route: reads date, id, weekLogId, dayOrder from query/route params
│   ├── If id exists → context = DEFERRED_DAY_LOG → setEditorContext(DEFERRED_DAY_LOG, id)
│   ├── If weekLogId + dayOrder exist → context = WEEK_LOG_DAY → setEditorContext(WEEK_LOG_DAY, weekLogId, dayOrder)
│   └── Otherwise → context = DEFERRED_DAY_LOG (empty form)
├── EditorContextService (holds containerType, containerId, dayOrder?, weekLogId)
│   └── Used by WorkoutSessionEditor to determine which API to call
└── WorkoutSessionEditor (composite component)
    └── OrchestratorComponent (orchestrates reusable widgets via @Input/@Output)
        ├── ExerciseSelector (reusable, exercise selection)
        ├── WorkoutEdition (reusable, handles WS sets/reps edition)
        └── ExtraSessionForm (reusable, extra session creation)
            └── Emits saveExtraSession / cancelExtraSession events

Mutations:
- DL: PlanDayService → PlanDayDomainService → PlanDayApi.updateWorkoutSession (WorkoutSessionVM)
  - Returns updated WorkoutSessionVM; no state/storage writes
- WL: PlanTrackingService.findById → resolves week → day workout session
  - onSave: WorkoutApi.updateWorkoutSession(workout, weekLogId) with the id from the route context (no store/active-state write)
  - onCompleteDay: TODO for backend completion of WL day
```

## Files

```
sdd/add-deferred-day/spec.md: this document (properties, constraints, architecture)
documents/plans/add-deferred-day/plan.md: implementation plan (tasks, validation)

Modified (existing):
- src/app/pages/user/history/day-deferred/day-deferred.ts — context detection, setEditorContext, containerType signal update
- src/app/pages/user/history/day-deferred/day-deferred.html — header/CTA based on containerType
- src/app/shared/components/widgets/tracking/workout-session-editor/workout-session-editor.ts — data loading, onSave/onCompleteDay branching, output events
- src/app/shared/components/widgets/tracking/workout-session-editor/workout-session-editor.html — context labeling, header, loading indicator, orchestrator host
- src/app/shared/components/widgets/tracking/workout-session-editor/orchestrator.component.ts — coordination of ExerciseSelector, WorkoutEdition, ExtraSessionForm with proper signals & event bindings
- src/app/shared/components/widgets/tracking/tracking-workout/workout-edition/workout-edition.html — cleanup legacy selector dialog
- src/app/core/services/editor-context/editor-context.interface.ts — already has required fields, no change needed
- src/app/core/services/editor-context/editor-context.service.ts — already has loadDeferredDayLogSession and loadWeekLogDaySession, no change needed
- src/app/shared/components/widgets/tracking/tracking-workout/tracking-workout.facade.ts — already has updateWorkoutSession, no change needed
```

## Tests

- **TEST-xxx**: Context detection in DayDeferred ngOnInit with all param combinations (id only, weekLogId+dayOrder only, only date)
- **TEST-xxx**: onSave() branching logic for DEFERRED_DAY_LOG vs WEEK_LOG_DAY
- **TEST-xxx**: onCompleteDay() correct behavior per containerType
- **TEST-xxx**: No state/storage modifications (BR-019) when editing deferred day
- **TEST-xxx**: Header text switches between DL and WL contexts
- **Existing tests**: `npm run test:ci` must maintain 764/764 passing (pre-existing coverage)

## Acceptance Criteria

- [ ] The deferred page `/user/history/deferred?date=...&id=...` loads a day-log and renders the read-only demo form with date, status, completed, notes, exercises, extra sessions.
- [ ] The same route with only `date` renders an empty demo form ("Sin ejercicios").
- [ ] The route `/user/history/week-log-day/:weekId/:dayOrder` loads the week-log day and allows WS editing via the same `WorkoutSessionEditor`.
- [ ] The header and CTA text switch between "Día diferido" / "Editor de Sesión de Día-Log Diferido" and "Día de semana" / "Editor de Día dentro de Semana" based on context.
- [ ] The `onSave` action works for both DL and WL contexts, using the appropriate API mutation (DL: `updateDayLog`; WL: local store update, TODO for backend).
- [ ] The `onCompleteDay` action flips the day status appropriately: DL → `completed: true, active: false`; WL → pending (TODO for backend).
- [ ] No active-tracking state (`setDayLog`, `markDayActive`, etc.) is modified when editing a deferred day.
- [ ] The exercise-selector and extra-session form are referenced as dependencies; their implementation is tracked in a separate spec/plan.
- [ ] All quality gates pass: `npm run typecheck`, `npm run lint`, `npm run test:ci`, `npm run build`.
